import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

import Drowsiness_Logo from '../component/img/Drowsiness-Logo.png';

const MainLayout: React.FC = () => {
    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-white text-black/70 p-4 md:inline hidden">
                <div className="w-full flex justify-center items-center p-4">
                    <img src={Drowsiness_Logo} alt="Logo" className="w-16 h-16"/>

                </div>
                <nav className="flex flex-col gap-2 text-lg">
                    <NavLink
                        to="dashboard"
                        className={({ isActive }) =>
                            `block p-3 rounded-lg transition-colors duration-200
                            ${isActive 
                            ? "bg-blue-500/20 text-blue-600 font-semibold" 
                            : "text-black/70 hover:bg-blue-500/10 hover:text-blue-600"}`
                        }
                    >
                        Dashboard
                    </NavLink>

                    <NavLink 
                        to="settings" 
                        className={({ isActive }) =>
                            `block p-3 rounded-lg transition-colors duration-200
                            ${isActive 
                            ? "bg-blue-500/20 text-blue-600 font-semibold" 
                            : "text-black/70 hover:bg-blue-500/10 hover:text-blue-600"}`
                        }
                    >
                        Settings
                    </NavLink>
                </nav>
            </aside>

            {/* Main content */}
            <main className="flex-1 bg-gray-100 md:p-6">
                {/* Outlet renders the nested route here */}
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
