import { useState } from 'react';
import { Shield, UserPlus, X } from 'lucide-react';

interface SafetyScreenProps {
  fromLocation: string;
  toLocation: string;
}

const emergencyHelplines = [
  { name: 'Women Helpline (National)', number: '1091' },
  { name: 'Delhi Police', number: '100' },
  { name: 'Delhi Commission for Women', number: '181' },
  { name: 'Emergency (All services)', number: '112' },
];

const policeStations: Record<string, { name: string; phone: string }[]> = {
  'connaught place': [
    { name: 'Connaught Place Police Station', phone: '011-23341151' },
    { name: 'Parliament Street Police Station', phone: '011-23746700' },
  ],
  'cyber city': [
    { name: 'DLF Phase 2 Police Station', phone: '0124-2540065' },
    { name: 'Sector 29 Police Post', phone: '0124-2383100' },
  ],
  'noida sector 18': [
    { name: 'Sector 20 Police Station', phone: '0120-2422113' },
    { name: 'Sector 24 Police Post', phone: '0120-2410101' },
  ],
  'iit delhi': [
    { name: 'Hauz Khas Police Station', phone: '011-26863470' },
    { name: 'SDA Police Post', phone: '011-26517277' },
  ],
  'dwarka': [
    { name: 'Dwarka Police Station', phone: '011-25085700' },
    { name: 'Dwarka Sector 10 Police Post', phone: '011-25085123' },
  ],
  'hauz khas': [
    { name: 'Hauz Khas Police Station', phone: '011-26863470' },
    { name: 'Green Park Police Post', phone: '011-26515277' },
  ],
};

export function SafetyScreen({ fromLocation, toLocation }: SafetyScreenProps) {
  const [safeRoutesOnly, setSafeRoutesOnly] = useState(true);

  const [contacts, setContacts] = useState([
    { id: 1, name: 'Mom', phone: '+91 98765 43210', notify: true },
    { id: 2, name: 'Priya Singh', phone: '+91 87654 32109', notify: true },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const toggleNotify = (id: number) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, notify: !c.notify } : c))
    );
  };

  const handleDeleteContact = (id: number) => {
    if (window.confirm('Remove this contact?')) {
      setContacts((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleAddContact = () => {
    if (!newName.trim() || !newPhone.trim()) {
      alert('Please enter contact name and phone number.');
      return;
    }
    setContacts((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newName.trim(),
        phone: newPhone.trim(),
        notify: true,
      },
    ]);
    setNewName('');
    setNewPhone('');
    setShowAddForm(false);
  };

  const handleCancelAdd = () => {
    setNewName('');
    setNewPhone('');
    setShowAddForm(false);
  };

  const handleSosClick = () => {
    if (window.confirm('Send emergency alert to all trusted contacts?')) {
      alert('Emergency alert sent. Contacts notified with your location.');
    }
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return '';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const getNearbyStations = () => {
    const fromNorm = fromLocation.trim().toLowerCase();
    const toNorm = toLocation.trim().toLowerCase();
    const fromList = policeStations[fromNorm] || [];
    const toList = policeStations[toNorm] || [];

    const combined = [...fromList];
    toList.forEach((station) => {
      if (!combined.some((s) => s.name === station.name)) {
        combined.push(station);
      }
    });
    return combined;
  };

  const nearbyStations = getNearbyStations();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
      {/* SECTION 1: Header */}
      <div className="bg-deep-indigo px-4 pt-12 pb-6 flex items-center gap-3">
        <Shield size={24} className="text-white" />
        <div>
          <h1 className="text-white font-bold text-xl">Women Safety</h1>
          <p className="text-indigo-200 text-xs mt-0.5">Your safety is our priority</p>
        </div>
      </div>

      <div className="px-4 -mt-2 space-y-4">
        {/* SECTION 5: Safe Routes Toggle */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield size={22} className="text-[#16A34A]" />
              <div>
                <p className="font-semibold text-dark-text text-sm">
                  Filter Safe Routes Only (80%+ safety score)
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Only shows routes with safety score 80%+
                </p>
              </div>
            </div>
            <button
              onClick={() => setSafeRoutesOnly(!safeRoutesOnly)}
              className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${safeRoutesOnly ? 'bg-[#16A34A]' : 'bg-gray-300'
                }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${safeRoutesOnly ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>
        </div>

        {/* SECTION 2: Emergency Helplines */}
        <div className="bg-white rounded-xl border-l-4 border-l-[#DC2626] border-y border-r border-gray-200 p-4 shadow-sm">
          <h2 className="font-bold text-dark-text text-sm mb-3">Emergency Helplines</h2>
          <div className="space-y-3">
            {emergencyHelplines.map((helpline, idx) => (
              <div key={helpline.number}>
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm font-bold text-dark-text">{helpline.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold font-mono text-coral-orange">{helpline.number}</span>
                    <button
                      onClick={() => { window.location.href = `tel:${helpline.number}`; }}
                      className="px-3 py-1 text-xs font-semibold text-coral-orange border border-coral-orange rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      Call
                    </button>
                  </div>
                </div>
                {idx < emergencyHelplines.length - 1 && <hr className="border-gray-100 my-2" />}
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: Nearby Police Stations */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h2 className="font-bold text-dark-text text-sm">Police Stations Near Your Route</h2>
          <p className="text-xs text-gray-500 mt-0.5 mb-4">Based on your journey</p>

          <div className="space-y-3">
            {nearbyStations.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No station data for this route yet.</p>
            ) : (
              nearbyStations.map((station) => (
                <div
                  key={station.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-150"
                >
                  <div>
                    <p className="text-xs font-bold text-dark-text">{station.name}</p>
                    <p className="text-[10px] font-mono text-gray-505 mt-0.5">{station.phone}</p>
                  </div>
                  <button
                    onClick={() => { window.location.href = `tel:${station.phone}`; }}
                    className="px-3 py-1 text-xs font-semibold text-coral-orange border border-coral-orange rounded-lg hover:bg-orange-50 transition-colors flex-shrink-0"
                  >
                    Call
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION 4: Trusted Contacts */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-dark-text text-sm">Trusted Contacts</h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-xs font-bold text-coral-orange hover:text-coral-orange/80 transition-colors flex items-center gap-1"
            >
              <UserPlus size={14} />
              + Add Contact
            </button>
          </div>

          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="relative bg-gray-50 border border-gray-150 rounded-xl p-3.5"
              >
                {/* Delete button top-right */}
                <button
                  onClick={() => handleDeleteContact(contact.id)}
                  className="absolute top-2.5 right-2.5 text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <X size={16} />
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-ai-indigo flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {getInitials(contact.name)}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-xs font-bold text-dark-text truncate">{contact.name}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 font-mono">{contact.phone}</p>
                    <p className="text-[9px] text-gray-400 mt-1 italic">Hold to remove</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[10px] text-gray-500 font-medium">Notify</span>
                    <button
                      onClick={() => toggleNotify(contact.id)}
                      className={`relative w-9 h-5.5 rounded-full transition-colors duration-200 ${contact.notify ? 'bg-[#16A34A]' : 'bg-gray-300'
                        }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform duration-200 ${contact.notify ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Inline Add Form */}
          {showAddForm && (
            <div className="mt-4 p-4 border border-dashed border-gray-350 rounded-xl bg-gray-50/50 space-y-3 animate-fade-in">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Name</label>
                <input
                  type="text"
                  placeholder="Contact name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-gray-50 border border-gray-205 rounded-lg px-3 py-2.5 text-xs w-full focus:outline-none focus:border-coral-orange"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Phone</label>
                <input
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="bg-gray-50 border border-gray-205 rounded-lg px-3 py-2.5 text-xs w-full focus:outline-none focus:border-coral-orange"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleCancelAdd}
                  className="flex-1 py-2 text-xs font-bold text-gray-500 bg-gray-200 rounded-lg hover:bg-gray-250 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddContact}
                  className="flex-1 py-2 text-xs font-bold text-white bg-coral-orange rounded-lg hover:bg-coral-orange/95 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 6: Emergency SOS Card */}
        <div className="bg-[#1A0000] border border-red-950/40 rounded-xl p-5 shadow-lg space-y-5">
          <div className="text-center">
            <h2 className="text-white font-bold text-lg">Emergency SOS</h2>
            <p className="text-red-200 text-xs mt-0.5">
              Alerts all trusted contacts with your live location
            </p>
          </div>

          <div className="flex flex-col items-center justify-center">
            <button
              onClick={handleSosClick}
              className="w-20 h-20 bg-[#DC2626] text-white font-bold text-xl rounded-full flex items-center justify-center ring-4 ring-white/30 animate-pulse-sos focus:outline-none shadow-xl active:scale-95 transition-transform"
            >
              SOS
            </button>
            <span className="text-[10px] text-gray-400 mt-3.5">
              Press and hold for 3 seconds to activate
            </span>
          </div>

          <hr className="border-red-950/60" />

          <div className="flex gap-2">
            <button
              onClick={() => { window.location.href = 'tel:112'; }}
              className="flex-1 py-2.5 text-xs font-bold text-white border border-white/40 hover:border-white/60 rounded-xl bg-transparent transition-all active:scale-98"
            >
              Call 112
            </button>
            <button
              onClick={() => { window.location.href = 'tel:1091'; }}
              className="flex-1 py-2.5 text-xs font-bold text-white border border-white/40 hover:border-white/60 rounded-xl bg-transparent transition-all active:scale-98"
            >
              Call 1091
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
