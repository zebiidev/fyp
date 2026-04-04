import {
  FaCar,
  FaShieldAlt,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Home = () => {
  const themeColors = [
    {
      name: "Primary",
      class: "bg-primary",
      text: "text-primary",
      desc: "Trust & Tech (Navigation, Main Buttons)",
    },
    {
      name: "Secondary",
      class: "bg-secondary",
      text: "text-secondary",
      desc: "Approachable (Join Ride, Secondary Actions)",
    },
    {
      name: "Success",
      class: "bg-success",
      text: "text-success",
      desc: "Safety & Completion (Active Rides, Ratings)",
    },
    {
      name: "Warning",
      class: "bg-warning",
      text: "text-warning",
      desc: "Emergency & Alerts (SOS, Cancel)",
    },
    {
      name: "Background (Surface)",
      class: "bg-surface",
      text: "text-slate-500",
      desc: "Clean Canvas (Page Backgrounds)",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-surface p-8 font-sans"
    >
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <FaCar className="text-6xl text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            FYP: Smart Campus Ride Sharing
          </h1>
          <p className="text-slate-600 text-lg">
            Current Theme Class:{" "}
            <span className="font-semibold text-primary">primary</span>
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {themeColors.map((color) => (
            <div
              key={color.name}
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4"
            >
              <div
                className={`${color.class} w-16 h-16 rounded-lg shadow-inner flex-shrink-0`}
              ></div>
              <div>
                <h3 className="font-bold text-slate-800">{color.name}</h3>
                <p className="text-sm text-slate-500 mb-1">{color.class}</p>
                <p className="text-xs font-medium text-slate-400">
                  {color.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            Component Preview
          </h2>
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4">
              <Link
                to="/passenger/dashboard"
                className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
              >
                Go to Dashboard
              </Link>
              <button className="bg-secondary text-white px-6 py-2 rounded-lg font-semibold hover:bg-secondary-dark transition-colors">
                Secondary Button
              </button>
              <button className="border-2 border-primary text-primary px-6 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition-colors">
                Outline Button
              </button>
            </div>

            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-success bg-emerald-50 px-3 py-1 rounded-full text-sm font-bold">
                <FaCheckCircle /> Ride Completed
              </div>
              <div className="flex items-center gap-2 text-warning bg-rose-50 px-3 py-1 rounded-full text-sm font-bold">
                <FaExclamationTriangle /> SOS Triggered
              </div>
              <div className="flex items-center gap-2 text-primary bg-indigo-50 px-3 py-1 rounded-full text-sm font-bold">
                <FaShieldAlt /> Driver Verified
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Home;
