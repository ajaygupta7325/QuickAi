import { useClerk, useUser, Protect } from '@clerk/clerk-react';
import {
    Hash,
    House,
    SquarePen,
    Image as ImageIcon,
    Eraser,
    Scissors,
    FileText,
    Users,
    LogOut,
} from 'lucide-react';
import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
    { to: '/ai', label: 'Dashboard', icon: House },
    { to: '/ai/write-article', label: 'Write Article', icon: SquarePen },
    { to: '/ai/blog-titles', label: 'Blog Titles', icon: Hash },
    { to: '/ai/generate-images', label: 'Generate Images', icon: ImageIcon },
    { to: '/ai/remove-background', label: 'Remove Background', icon: Eraser },
    { to: '/ai/remove-object', label: 'Remove Object', icon: Scissors },
    { to: '/ai/review-resume', label: 'Review Resume', icon: FileText },
    { to: '/ai/community', label: 'Community', icon: Users },
];

const Sidebar = ({ sidebar, setSidebar }) => {
    const { user } = useUser();
    const { signOut, openUserProfile } = useClerk();

    return (
        <div
            className={`
        ${sidebar ? 'w-60' : 'w-0'}
        sm:w-60
        bg-white border-r border-gray-200 flex flex-col justify-between
        max-sm:absolute top-14 bottom-0
        ${sidebar ? 'translate-x-0' : '-translate-x-full'}
        transition-all duration-300 ease-in-out overflow-hidden z-30
      `}
        >
            {/* User Info */}
            <div className="my-6 px-4 text-center">
                <img
                    src={user?.imageUrl}
                    alt="User Avatar"
                    className="w-16 h-16 rounded-full mx-auto object-cover"
                />
                <h1 className="mt-2 font-medium text-sm">{user?.fullName || 'User'}</h1>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-1 px-4 flex-grow overflow-auto">
                {navItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/ai'}
                        onClick={() => {
                            if (window.innerWidth < 640) setSidebar(false);
                        }}
                        className={({ isActive }) =>
                            `px-4 py-2 flex items-center gap-3 rounded-lg transition-all duration-200 ${isActive
                                ? 'bg-gradient-to-r from-[#3C81F6] to-[#9234EA] text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`
                        }
                    >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm">{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Actions */}
            <div className='w-full border-t border-gray-200 px-7 flex items-center
     justify-between'>
                <div onClick={openUserProfile} className='flex gap-2 items-center cursor-pointer' >
                    <img src={user.imageUrl} alt="" className='w-8 rounded-full' />
                    <div>
                        <h1 className='text-sm font-medium'>{user.fullName}</h1>
                        <p className='text-xs text-gray-500'>
                            <Protect plan='premium' fallback='Free'>Premium</Protect>
                            Plan
                        </p>
                    </div>
                </div>
                <LogOut onClick={() => signOut} className='w-4.5 text-gray-400
        hover:text-gray-700 transition cursor-pointer'/>
            </div>



            {/* <div className="mb-6 px-4 flex flex-col gap-2">
        <button
          onClick={openUserProfile}
          className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm"
        >
          Profile
        </button>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 bg-red-100 rounded hover:bg-red-200 text-sm text-red-600"
        >
          Sign Out
        </button>
      </div> */}
        </div>
    );
};

export default Sidebar;
