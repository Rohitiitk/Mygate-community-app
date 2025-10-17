import React from "react";

const Navbar = () => {
  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold">MyGate Dashboard</h1>
      <ul className="flex gap-4">
        <li className="hover:text-gray-200 cursor-pointer">Home</li>
        <li className="hover:text-gray-200 cursor-pointer">Profile</li>
        <li className="hover:text-gray-200 cursor-pointer">Logout</li>
      </ul>
    </nav>
  );
};

export default Navbar;
