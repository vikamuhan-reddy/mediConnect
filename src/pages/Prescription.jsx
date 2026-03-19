import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, Download, Printer, Share2, Calendar, 
  User, Clipboard, Pill, AlertCircle, ChevronLeft,
  CheckCircle2, MapPin, Phone, Mail
} from 'lucide-react';
import api from '../services/api';
import Loader from '../components/Loader';

export default function Prescription() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [prescription, setPrescription] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPrescription = async () => {
      try {
        const res = await api.get(`/prescriptions/${appointmentId}`);
        setPrescription(res.data);
      } catch (err) {
        console.error('Failed to fetch prescription', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrescription();
  }, [appointmentId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert('Downloading prescription as PDF...');
  };

  if (loading) return <Loader fullScreen />;
  if (!prescription) return (
    <div className="text-center py-20">
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <FileText className="w-10 h-10 text-slate-300" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Prescription Not Found</h2>
      <p className="text-slate-500 mb-8">We couldn't find a prescription for this appointment.</p>
      <button 
        onClick={() => navigate(-1)}
        className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
      >
        Go Back
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Appointments
        </button>
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
            title="Print"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden print:border-none print:shadow-none">
        {/* Header */}
        <div className="bg-slate-50 p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Activity className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">MediConnect</h1>
              <p className="text-emerald-600 font-bold text-xs uppercase tracking-widest">Digital Healthcare Portal</p>
            </div>
          </div>
          <div className="text-right space-y-1">
            <p className="text-sm font-bold text-slate-900">Dr. Sarah Smith</p>
            <p className="text-xs text-slate-500">Cardiologist • MBBS, MD</p>
            <p className="text-xs text-slate-500 flex items-center justify-end gap-1">
              <MapPin className="w-3 h-3" /> Apollo Hospitals, New York
            </p>
          </div>
        </div>

        <div className="p-8 md:p-12 space-y-12">
          {/* Patient & Appointment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Patient Details</h3>
              <div className="space-y-2">
                <p className="text-lg font-bold text-slate-900">John Doe</p>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span>Age: 28</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span>Gender: Male</span>
                </div>
                <p className="text-sm text-slate-500">Patient ID: #MC-2024-001</p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Appointment Info</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  {new Date(prescription.date).toLocaleDateString('en-US', { dateStyle: 'long' })}
                </div>
                <p className="text-sm text-slate-500">Prescription ID: {prescription.id}</p>
                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase">
                  <CheckCircle2 className="w-3 h-3" /> Verified Digital Copy
                </div>
              </div>
            </div>
          </div>

          {/* Diagnosis */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Diagnosis & Observations</h3>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-slate-700 leading-relaxed">
                Patient presented with mild chest discomfort and fatigue. Blood pressure was slightly elevated (135/85). Recommended lifestyle changes and medication for blood pressure management.
              </p>
            </div>
          </div>

          {/* Medications */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Prescribed Medications</h3>
            <div className="overflow-hidden border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Medicine</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dosage</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prescription.medicines.map((med, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                            <Pill className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-900">{med.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600 font-medium">{med.dosage}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">{med.instructions}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Advice */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">General Advice</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-3 p-4 bg-blue-50 rounded-2xl text-blue-700 border border-blue-100">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">Drink plenty of water and maintain a low-sodium diet.</p>
              </div>
              <div className="flex gap-3 p-4 bg-emerald-50 rounded-2xl text-emerald-700 border border-emerald-100">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">Follow up in 2 weeks for a blood pressure check.</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-12 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-slate-100">
            <div className="text-center md:text-left space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-4 text-slate-400">
                <Phone className="w-4 h-4" />
                <span className="text-xs">+1 (555) 000-1234</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-4 text-slate-400">
                <Mail className="w-4 h-4" />
                <span className="text-xs">support@mediconnect.com</span>
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="w-32 h-12 bg-slate-50 rounded-lg border border-slate-200 mb-2 mx-auto md:ml-auto flex items-center justify-center italic text-slate-300">
                Digital Signature
              </div>
              <p className="text-xs font-bold text-slate-900">Dr. Sarah Smith</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Authorized Practitioner</p>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-center text-xs text-slate-400 pb-8">
        This is a digitally generated prescription and does not require a physical signature. 
        Please present this digital copy or a printout at any authorized pharmacy.
      </p>
    </div>
  );
}

function Activity(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
