import EmployeeSidebar from "../../components/EmployeeSidebar";
import FormHeader from "../components/FormHeader";

export default function ReturnBike() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <EmployeeSidebar />

      <div className="flex-1 p-10">

        <div className="bg-white shadow-md rounded-xl overflow-hidden border">

          <FormHeader title="E-Bike Return Form" />

          <div className="p-10 space-y-6">

            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Mobile Number *</h3>
              <input 
                type="text"
                placeholder="Rider mobile number"
                className="w-full border rounded-xl px-4 py-2"
              />
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Vehicle Number *</h3>
              <input 
                type="text"
                placeholder="MP09AB1234"
                className="w-full border rounded-xl px-4 py-2"
              />
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Upload Return Vehicle Photos *</h3>
              <input 
                type="file"
                multiple
                className="w-full border rounded-xl px-4 py-2"
              />
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Vehicle Condition *</h3>
              <textarea 
                placeholder="Describe any scratches, damages, or issues..."
                className="w-full border rounded-xl px-4 py-3 h-28"
              />
            </div>

            <button className="mt-4 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl w-full">
              Submit Return
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}
