import UserSidebar from "../components/UserSidebar";
import FormHeader from "../components/FormHeader";

export default function RetainRider() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <UserSidebar />

      <div className="flex-1 p-10">
        
        <div className="bg-white shadow-md rounded-xl overflow-hidden border">

          <FormHeader title="E-Bike Retention / Rider Extension Form" />

          <div className="p-10 space-y-6">

            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Registered Mobile Number *</h3>
              <input 
                type="text"
                placeholder="Enter rider's registered mobile number"
                className="w-full border rounded-xl px-4 py-2"
              />
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Extend Plan *</h3>
              <select className="w-full border rounded-xl px-4 py-2">
                <option>Select Extension Plan</option>
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-1">New Return Date *</h3>
              <input 
                type="date"
                className="w-full border rounded-xl px-4 py-2"
              />
            </div>

            <button className="mt-4 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl w-full">
              Submit Extension
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
