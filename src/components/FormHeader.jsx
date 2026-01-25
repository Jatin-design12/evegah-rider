import Logo from "../assets/evegah-logo-white.webp";

export default function FormHeader({ title }) {
  return (
    <div className="bg-[#4A1FB8] text-white rounded-t-xl p-6 px-10 shadow-sm">
      <div className="flex justify-between items-start">
        
        {/* Left Side */}
        <div>
          <img src={Logo} className="w-32 mb-1" />
          <p className="text-sm opacity-90">Shared E-Mobility Solutions</p>
        </div>

        {/* Right Side */}
        <div className="text-right text-sm opacity-90 leading-tight">
          <p className="font-semibold">EVEGAH MOBILITY PVT LTD</p>
          <p>CIN: U34300MP2022PTC059373</p>
          <p>www.evegah.com</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-center mt-6">
        {title}
      </h2>
    </div>
  );
}
