import React, { useState } from 'react';
import {
  FileText,
  Download,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Eye,
  HardDrive,
  ShieldCheck,
  X,
  Camera,
  Trash2,
} from 'lucide-react';
import { WasteReport } from '../types';

interface ResolutionLogsProps {
  reports: WasteReport[];
  onViewReport: (report: WasteReport) => void;
}

export const ResolutionLogs: React.FC<ResolutionLogsProps> = ({
  reports,
  onViewReport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPurok, setFilterPurok] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedInspectReport, setSelectedInspectReport] = useState<WasteReport | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const filtered = reports.filter((r) => {
    const matchesSearch =
      r.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.residentName ? r.residentName.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
      (r.streetAddress && r.streetAddress.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.purok.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPurok = filterPurok === 'ALL' || r.purok.includes(filterPurok);
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    return matchesSearch && matchesPurok && matchesStatus;
  });

  // Calculate Raspberry Pi 4 storage analytics
  const totalResidentPhotos = reports.reduce((acc, r) => acc + (r.photos?.length || 0), 0);
  const totalProofPhotos = reports.reduce((acc, r) => acc + (r.proofPhotos?.length || 0), 0);
  const totalResidentMb = reports.reduce((acc, r) => acc + (r.residentPhotosSizeMb || (r.photos?.length || 0) * 0.8), 0);
  const totalProofMb = reports.reduce((acc, r) => acc + (r.proofPhotosSizeMb || (r.proofPhotos?.length || 0) * 0.75), 0);
  const totalPiStorageMb = +(totalResidentMb + totalProofMb).toFixed(2);

  const exportToCSV = () => {
    const headers = [
      'Ticket Number',
      'Status',
      'Created Date/Time',
      'Completed/Resolved Date',
      'Barangay (Cavite City)',
      'Address',
      'Resident',
      'Needs Assistance Outside',
      'Senior Priority',
      'Severity Level',
      'Waste Types',
      'Resident Photos Count',
      'Kagawad Proof Photos Count',
      'Pi 4 Storage Used (MB)',
      'Resolved By / Proof Notes',
      'Cancellation Reason',
      'TTL Auto-Purge Expiry',
    ];

    const rows = filtered.map((r) => [
      `"${r.ticketNumber}"`,
      `"${r.status}"`,
      `"${new Date(r.createdAt).toLocaleString()}"`,
      `"${r.resolvedAt ? new Date(r.resolvedAt).toLocaleString() : 'N/A'}"`,
      `"${r.purok}"`,
      `"${(r.streetAddress || '')} ${(r.houseNumber || '')}"`,
      `"${r.residentName || 'N/A'}"`,
      `"${r.needsAssistanceOutside ? 'YES' : 'NO'}"`,
      `"${r.isElderly ? 'YES' : 'NO'}"`,
      `"${r.severityLevel}"`,
      `"${r.wasteTypes.join(', ')}"`,
      r.photos?.length || 0,
      r.proofPhotos?.length || 0,
      r.storageUsedMb || ((r.photos?.length || 0) * 0.8 + (r.proofPhotos?.length || 0) * 0.75).toFixed(2),
      `"${r.resolutionNotes || r.resolvedBy || 'N/A'}"`,
      `"${r.cancellationReason || 'N/A'}"`,
      `"${new Date(r.expiresAt).toLocaleString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DRAW_CaviteCity_Audit_Logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-6">
      {/* Header and Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <FileText className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black text-slate-900">
              Logbook ng Basura at Proeba ng Kagawad
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Makikita rito ang mga litrato ng residente at ang kalakip na proeba ng Kagawad na kumakain sa transit storage ng Raspberry Pi 4B.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>I-export ang CSV Record</span>
          </button>
        </div>
      </div>

      {/* Raspberry Pi 4 Storage Consumption Tracker Banner */}
      <div className="bg-slate-950 text-white rounded-2xl p-4 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-white">
                Raspberry Pi 4B Cloud Storage Breakdown (Transit Buffer):
              </span>
              <p className="text-[11px] text-slate-400">
                Lahat ng litrato ay pansamantalang nakatambak sa 32GB disk ng Pi 4 bago i-auto purge sa loob ng 3 araw.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-xs font-black">
              {totalPiStorageMb} MB Ginamit sa Pi
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono pt-1">
          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">📸 Resident Photos:</span>
            <span className="text-white font-bold">{totalResidentPhotos} litrato (~{totalResidentMb.toFixed(1)} MB)</span>
          </div>
          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-emerald-400">🛡️ Kagawad Proofs:</span>
            <span className="text-emerald-300 font-bold">{totalProofPhotos} proeba (~{totalProofMb.toFixed(1)} MB)</span>
          </div>
          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-purple-400">⏳ Retention TTL:</span>
            <span className="text-purple-300 font-bold">3 Araw bago burahin</span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Hanapin ang ticket, residente, o kalye..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium bg-slate-50 focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <select
            value={filterPurok}
            onChange={(e) => setFilterPurok(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50"
          >
            <option value="ALL">Lahat ng Tala (Barangay 41, Cavite City)</option>
            <option value="Barangay 41">Barangay 41, Cavite City</option>
          </select>
        </div>
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50"
          >
            <option value="ALL">Lahat ng Status (Lahat Makikita)</option>
            <option value="RESOLVED">Natapos na may Proeba (Resolved)</option>
            <option value="CANCELLED">Kinansela Lamang (Cancelled)</option>
            <option value="DISPATCHED">Dispatched Lamang</option>
            <option value="PENDING">Pending Lamang</option>
          </select>
        </div>
      </div>

      {/* Mobile Card View (Adaptive for Cellphone Screen) */}
      <div className="block sm:hidden space-y-3">
        {filtered.length > 0 ? (
          filtered.map((report) => (
            <div
              key={report.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900">{report.ticketNumber}</span>
                  {report.isElderly && (
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700">
                      Senior
                    </span>
                  )}
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    report.status === 'RESOLVED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : report.status === 'CANCELLED'
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {report.status === 'RESOLVED' ? '✓ Natapos (May Proeba)' : report.status === 'CANCELLED' ? 'Kinansela' : report.status}
                </span>
              </div>

              <div>
                <div className="font-bold text-slate-800">{report.purok}</div>
                {report.streetAddress && (
                  <div className="text-[11px] text-slate-700 font-medium">
                    {report.streetAddress} {report.houseNumber}
                  </div>
                )}
                {report.residentName ? (
                  <div className="text-[11px] text-slate-500 font-medium">
                    Residente: {report.residentName}
                  </div>
                ) : null}
              </div>

              {/* Photo Galleries (Resident vs Kagawad Proof) */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-600">📸 Resident Photos ({report.photos.length}):</span>
                  <span className="font-mono text-[10px] text-slate-400">~{((report.photos?.length || 0) * 0.8).toFixed(1)} MB</span>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {report.photos.map((p, idx) => (
                    <img
                      key={idx}
                      src={p}
                      alt="Resident submission"
                      onClick={() => setPreviewPhoto(p)}
                      className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0 cursor-pointer"
                    />
                  ))}
                </div>

                {report.proofPhotos && report.proofPhotos.length > 0 && (
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-black text-emerald-950">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Proeba ng Kagawad:</span>
                      </span>
                      <span className="font-mono text-[10px] text-emerald-700">
                        {report.proofPhotos.length} patunay (~{((report.proofPhotos.length) * 0.75).toFixed(1)} MB)
                      </span>
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto">
                      {report.proofPhotos.map((proofImg, pIdx) => (
                        <img
                          key={pIdx}
                          src={proofImg}
                          alt="Kagawad proof"
                          onClick={() => setPreviewPhoto(proofImg)}
                          className="w-14 h-14 rounded-lg object-cover border-2 border-emerald-500 shrink-0 cursor-pointer"
                        />
                      ))}
                    </div>
                    {report.resolutionNotes && (
                      <p className="text-[10px] text-emerald-800 italic">
                        &quot;{report.resolutionNotes}&quot;
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Storage Telemetry Tag */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] font-mono text-slate-500">
                <span>Pi 4 Consumed: ~{report.storageUsedMb || ((report.photos.length * 0.8) + ((report.proofPhotos?.length || 0) * 0.75)).toFixed(1)} MB</span>
                <span>Auto-Purge: {new Date(report.expiresAt).toLocaleDateString()}</span>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => onViewReport(report)}
                  className="px-3 py-1.5 rounded-xl bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Tingnan sa Mapa</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            Walang tala na tumutugma sa filter.
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Ticket</th>
              <th className="py-3 px-4">Petsa / Oras</th>
              <th className="py-3 px-4">Lokasyon</th>
              <th className="py-3 px-4">Litrato ng Residente</th>
              <th className="py-3 px-4">Proeba ng Kagawad</th>
              <th className="py-3 px-4">Pi 4 Storage Kumakain</th>
              <th className="py-3 px-4 text-right">Aksyon</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {filtered.length > 0 ? (
              filtered.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-slate-900">{report.ticketNumber}</div>
                    {report.residentName ? (
                      <div className="text-[11px] text-slate-500">{report.residentName}</div>
                    ) : null}
                    {report.isElderly && (
                      <span className="inline-block mt-0.5 text-[9px] font-black px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700">
                        Senior Priority
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-[11px] text-slate-600">
                    <div>{new Date(report.createdAt).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(report.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{report.purok}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {report.streetAddress || 'Auto-GPS'}
                    </div>
                  </td>
                  {/* Resident Photos */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1">
                      {report.photos && report.photos.length > 0 ? (
                        report.photos.slice(0, 3).map((p, idx) => (
                          <img
                            key={idx}
                            src={p}
                            alt=""
                            onClick={() => setPreviewPhoto(p)}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 cursor-pointer hover:opacity-80 shrink-0"
                          />
                        ))
                      ) : (
                        <span className="text-slate-400 text-[11px]">Wala</span>
                      )}
                      {report.photos.length > 3 && (
                        <span className="text-[10px] font-bold text-slate-400 ml-1">
                          +{report.photos.length - 3}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      {report.photos.length} litrato (~{((report.photos.length) * 0.8).toFixed(1)} MB)
                    </span>
                  </td>
                  {/* Kagawad Proof Photo */}
                  <td className="py-3.5 px-4">
                    {report.status === 'RESOLVED' ? (
                      report.proofPhotos && report.proofPhotos.length > 0 ? (
                        <div>
                          <div className="flex items-center gap-1">
                            {report.proofPhotos.map((proofImg, pIdx) => (
                              <img
                                key={pIdx}
                                src={proofImg}
                                alt="Proof"
                                onClick={() => setPreviewPhoto(proofImg)}
                                className="w-10 h-10 rounded-lg object-cover border-2 border-emerald-500 cursor-pointer hover:opacity-80 shrink-0"
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5 mt-0.5">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Nakolekta na (May Proeba)</span>
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                            Inaksyunan (Mensahe)
                          </span>
                          {report.resolutionNotes && (
                            <p className="text-[10px] text-slate-500 line-clamp-1 italic max-w-xs">
                              &quot;{report.resolutionNotes}&quot;
                            </p>
                          )}
                        </div>
                      )
                    ) : report.status === 'CANCELLED' ? (
                      <span className="text-[11px] text-slate-400 font-bold">Kinansela</span>
                    ) : report.needsAssistanceOutside || report.isWithinBrgy41 === false ? (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        Assistance (Mensahe)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        Kailangan ng Proeba
                      </span>
                    )}
                  </td>
                  {/* Pi 4 Storage Usage */}
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <div className="font-bold text-slate-900">
                      ~{report.storageUsedMb || ((report.photos.length * 0.8) + ((report.proofPhotos?.length || 0) * 0.75)).toFixed(2)} MB
                    </div>
                    <div className="text-[10px] text-slate-400">
                      TTL: 3 araw auto-purge
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onViewReport(report)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 transition-colors cursor-pointer"
                      title="Inspect pin on map"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Walang tala na tumutugma sa filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Lightbox Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <img
              src={previewPhoto}
              alt="Preview"
              className="max-h-[85vh] w-auto object-contain rounded-2xl"
            />
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
