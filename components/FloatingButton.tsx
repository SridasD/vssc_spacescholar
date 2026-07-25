"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface FloatingButtonProps {
  href: string;
  icon: React.ReactNode;
}


const FloatingButton: React.FC<FloatingButtonProps> = ({ href, icon }) => {
    return (
      <motion.div
        className="fixed bottom-8 right-8"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
      >
        <Link 
          href={href}
          className="flex items-center justify-center w-16 h-16 text-white bg-primary rounded-full shadow-lg hover:bg-primary/90"
        >
          {icon}
        </Link>
      </motion.div>
    );
  };
  

export default FloatingButton;