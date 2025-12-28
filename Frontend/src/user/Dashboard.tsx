
import { useState } from 'react'
import SettingIcon from '../component/svg/Setting'
import MotorVolumeIcon from '../component/svg/MotorVolumeIcon'
import BuzzerIcon from '../component/svg/BuzzerIcon'

import PlayIcon from '../component/svg/PlayerIcon'
import FullscreenIcon from '../component/svg/FullscreenIcon'
import CameraIcon from '../component/svg/CameraIcon'
import SystemStatusIcon from '../component/svg/SystemStatusIcon'

import MicroControllerIcon from '../component/svg/MicroControllerIcon'
import AlertModuleIcon from '../component/svg/AlertModule'
import PlainCameraIcon from '../component/svg/PlainCameraIcon'

function Dashboard() {
    const [volumes, setVolumes] = useState([
        { type:"motor", name: "Motor Vibration", volume: 100, icon: MotorVolumeIcon },
        { type:"buzzer", name: "Buzzer Volume", volume: 100, icon: BuzzerIcon },
    ])

    const systemStatus = [
        {type:"micro-controller", name:"Micro Controller", status: "Inactive", icon: MicroControllerIcon},
        {type:"alert-module", name:"Alert Module", status: "Active", icon: AlertModuleIcon},
        {type:"camera", name:"Camera", status: "Inactive", icon: PlainCameraIcon},
    ]

    const handleVolumeChange = (index: number, newValue: number) => {
        const newVolumes = [...volumes];
        newVolumes[index].volume = newValue;
        setVolumes(newVolumes);
    }
    return (
        <div>
            <div className={`bg-[#C52233] px-8 py-4 min-h-30 md:rounded-lg flex justify-between items-end`}>
                <div className="text-white inter">
                    <h1 className="tracking-wide text-2xl font-semibold">Welcome, User</h1>
                    <span className="text-sm font-light tracking-wide">Stay alert, drive safe</span>
                </div>

                <div className="flex mb-7 mr-5">
                    <SettingIcon className="text-white"/>
                </div>
            </div>

            <div className="flex flex-col gap-6 mt-10 p-4">
                {volumes.map((vol, index) => {
                    const Icon = vol.icon;
                    return (
                        <div className="flex flex-col p-7 border rounded-xl gap-5">
                            <div className="flex flex-row gap-3">
                                <Icon className="text-black" />
                                {vol.name}
                            </div>

                            <div className="flex flex-row gap-3 items-center">
                                <input 
                                    type="range"
                                    min={0}
                                    max={100}
                                    value={vol.volume}
                                    onChange={(e) => handleVolumeChange(index, Number(e.target.value))}
                                    className="w-full h-1 rounded-full accent-red-600"
                                    style={{
                                        background: `linear-gradient(to right, #DE0303 0%, #DE0303 ${vol.volume}%, #ccc ${vol.volume}%, #ccc 100%)`
                                    }}
                                />
                                <span className="text-sm text-black rounded-md bg-[#B5B4B4] p-2">{vol.volume}%</span>
                            </div>
                            
                            <button className="bg-[#F5E2E4] border rounded-lg flex flex-row items-center justify-center p-3">
                                <PlayIcon />
                                <h1>Test</h1>
                            </button>
                        </div>
                    );
                })}
                    
                <div className="flex flex-col border rounded-xl p-2 ">
                    <div className="flex flex-row w-full justify-between">
                        <h1 className="font-semibold">Camera Field</h1>
                        <FullscreenIcon />
                    </div>
                    <div className="flex items-center justify-center p-20">
                        <CameraIcon />
                    </div>
                </div>

                <div className="flex flex-col border rounded-xl p-4 gap-4">
                    <div className="flex flex-row gap-2">
                        <SystemStatusIcon />
                        <h1 className="text-xl font-bold">System Status</h1>
                    </div>

                    {/* System Status (Micro Controller, Alert Modules and Camera) */}
                    {systemStatus.map((stat, index) => {
                        const Icon = stat.icon;

                        return (
                            <div className="flex flex-row items-center px-3 py-1 justify-between">
                                <div className="flex flex-row gap-6 text-lg">
                                    <Icon 
                                        className={`
                                            ${stat.status?.toLowerCase() === "active" ? "text-[#01D901]" : "text-[#C52233]"} w-7 h-7`
                                        }
                                    />
                                    <span>{stat.name}</span>
                                </div>

                                <span 
                                    className={
                                        `${stat.status?.toLowerCase() === "active" ? "text-[#01D901]" : "text-[#C52233]"}`
                                    }
                                >
                                    {stat.status}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default Dashboard
