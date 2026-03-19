import { useState } from 'react';
import api from '../services/api';

const FREQUENCY_OPTIONS = [
  'morning',
  'afternoon',
  'night',
  'morning, night',
  'morning, afternoon, night',
];

const emptyMedicine = () => ({
  name: '',
  dosage: '',
  frequency: 'morning, night',
  duration: 5,
  instructions: '',
});

export default function PrescriptionForm({ patientId, appointmentId, onSuccess }) {
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState([emptyMedicine()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Medicine row helpers ──────────────────────
  const updateMedicine = (index, field, value) => {
    setMedicines((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const addMedicine = () => setMedicines((prev) => [...prev, emptyMedicine()]);

  const removeMedicine = (index) =>
    setMedicines((prev) => prev.filter((_, i) => i !== index));

  // ── Submit ────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate at least one medicine has a name
    if (medicines.every((m) => !m.name.trim())) {
      setError('Add at least one medicine.');
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post('/prescriptions', {
        patientId,
        appointmentId: appointmentId || undefined,
        diagnosis,
        notes,
        medicines: medicines.filter((m) => m.name.trim()),
      });

      onSuccess?.(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save prescription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="prescription-form">
      <h2 className="form-title">Write Prescription</h2>

      {/* ── Diagnosis & Notes ── */}
      <div className="field-group">
        <label>Diagnosis</label>
        <input
          type="text"
          placeholder="e.g. Viral fever"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
        />
      </div>

      <div className="field-group">
        <label>Notes</label>
        <textarea
          placeholder="Additional notes for patient..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      {/* ── Medicines Table ── */}
      <div className="medicines-section">
        <div className="medicines-header">
          <h3>Medicines</h3>
          <button type="button" className="btn-add" onClick={addMedicine}>
            + Add Medicine
          </button>
        </div>

        {medicines.map((med, i) => (
          <div key={i} className="medicine-row">
            <div className="medicine-row-top">
              <span className="med-num">#{i + 1}</span>
              {medicines.length > 1 && (
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => removeMedicine(i)}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="medicine-fields">
              <div className="field">
                <label>Medicine Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol"
                  value={med.name}
                  onChange={(e) => updateMedicine(i, 'name', e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Dosage *</label>
                <input
                  type="text"
                  placeholder="e.g. 500mg"
                  value={med.dosage}
                  onChange={(e) => updateMedicine(i, 'dosage', e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Frequency</label>
                <select
                  value={med.frequency}
                  onChange={(e) => updateMedicine(i, 'frequency', e.target.value)}
                >
                  {FREQUENCY_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field field-sm">
                <label>Duration (days)</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={med.duration}
                  onChange={(e) =>
                    updateMedicine(i, 'duration', Number(e.target.value))
                  }
                />
              </div>

              <div className="field field-wide">
                <label>Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. After meals"
                  value={med.instructions}
                  onChange={(e) =>
                    updateMedicine(i, 'instructions', e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="error-msg">{error}</p>}

      <button type="submit" className="btn-submit" disabled={loading}>
        {loading ? 'Saving...' : '💊 Save Prescription & Create Reminders'}
      </button>
    </form>
  );
}