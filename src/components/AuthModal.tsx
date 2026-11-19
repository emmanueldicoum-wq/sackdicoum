import React, { useState } from 'react';
import { X, Lock, Mail, Phone, Store, MapPin, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { MerchantProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onLoginSuccess: (merchantData?: Partial<MerchantProfile>) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [phone, setPhone] = useState('+229 97 45 88 12');
  const [email, setEmail] = useState('sika.houngbo@elegancecotonou.bj');
  const [password, setPassword] = useState('••••••••');
  const [storeName, setStoreName] = useState('Maison Wax & Élégance Cotonou');
  const [city, setCity] = useState('Cotonou');
  const [category, setCategory] = useState('Mode & Wax');
  const [ifuNumber, setIfuNumber] = useState('3201948839210');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess({
      storeName: storeName || 'Boutique Pro Cotonou',
      city: city || 'Cotonou',
      ifuNumber: ifuNumber || '3201948839210',
      phone: phone || '+229 97 45 88 12',
    });
  };

  const handleQuickDemo = () => {
    onLoginSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Header Header Pattern */}
        <div className="bg-gradient-to-br from-[#0B192C] via-[#1E3E62] to-[#0B192C] p-6 text-white text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white font-black text-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-sky-500/30">
            BP
          </div>
          <h3 className="font-heading font-extrabold text-2xl tracking-tight">
            {mode === 'login' ? 'Connexion Marchand' : 'Créer votre Boutique'}
          </h3>
          <p className="text-xs text-sky-200 mt-1">
            {mode === 'login' 
              ? 'Accédez à votre tableau de bord et à vos commandes' 
              : 'Rejoignez les commerçants modernes au Bénin'}
          </p>

          {/* Mode Switch Tabs */}
          <div className="flex bg-black/30 p-1 rounded-xl mt-5">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              Se Connecter
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              Nouvelle Boutique
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom de votre commerce ou boutique
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Ex: Élégance Dantokpa, Bio Bénin..."
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ville principale
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                      >
                        <option value="Cotonou">Cotonou</option>
                        <option value="Abomey-Calavi">Abomey-Calavi</option>
                        <option value="Porto-Novo">Porto-Novo</option>
                        <option value="Parakou">Parakou</option>
                        <option value="Bohicon">Bohicon</option>
                        <option value="Ouidah">Ouidah</option>
                        <option value="Autre">Autre ville</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Secteur d'activité
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                    >
                      <option value="Mode & Wax">Mode & Wax</option>
                      <option value="Cosmétique Bio">Cosmétique Bio</option>
                      <option value="Alimentation Locale">Alimentation</option>
                      <option value="Artisanat & Déco">Artisanat</option>
                      <option value="Autre">Général / Divers</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Numéro WhatsApp / Téléphone Mobile Money
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+229 97 00 00 00"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adresse Email (optionnelle)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@boutique.bj"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Mot de passe
                </label>
                {mode === 'login' && (
                  <span className="text-[11px] text-sky-600 hover:underline cursor-pointer">
                    Oublié ?
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Numéro IFU Bénin (Optionnel)
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={ifuNumber}
                    onChange={(e) => setIfuNumber(e.target.value)}
                    placeholder="13 chiffres (ex: 3201948839210)"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0B192C] to-sky-700 hover:from-sky-800 hover:to-sky-600 text-white font-bold text-sm shadow-md shadow-sky-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>{mode === 'login' ? 'Accéder à mon tableau de bord' : 'Créer ma boutique gratuitement'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Option */}
          <div className="mt-5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="w-full py-2.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold border border-sky-200 flex items-center justify-center gap-2 transition-colors"
            >
              <Check className="w-4 h-4 text-sky-600" />
              <span>Tester directement avec le profil Marchand Bénin (Démo)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
