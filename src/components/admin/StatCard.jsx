import { motion } from "framer-motion";

export default function StatCard({ title, value, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-evegah-card border border-evegah-border shadow-card rounded-2xl p-5 flex items-center gap-4"
    >
      <div className="w-12 h-12 flex items-center justify-center bg-blue-50 text-blue-700 rounded-xl">
        <Icon size={28} />
      </div>

      <div>
        <p className="text-evegah-muted text-sm">{title}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>
    </motion.div>
  );
}
