
import { useState } from 'react'
import SettingIcon from '../component/svg/Setting'
import MotorVolumeIcon from '../component/svg/MotorVolumeIcon'
import BuzzerIcon from '../component/svg/BuzzerIcon'

import PlayIcon from '../component/svg/PlayerIcon'

function Dashboard() {
    const [volumes, setVolumes] = useState([
        { type:"motor", name: "Motor Vibration", volume: 100, icon: MotorVolumeIcon },
        { type:"buzzer", name: "Buzzer Volume", volume: 100, icon: BuzzerIcon },
    ])

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
                        <div className="flex flex-col p-7 border rounded-lg gap-5">
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
            </div>
        </div>
    )
}

export default Dashboard
