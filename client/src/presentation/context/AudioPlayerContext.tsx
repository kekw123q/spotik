import { createContext, useContext, ReactNode } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

type AudioPlayerContextType = ReturnType<typeof useAudioPlayer>;

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export const AudioPlayerProvider = ({ children }: { children: ReactNode }) => {
    const player = useAudioPlayer();

    return (
        <AudioPlayerContext.Provider value={player}>
            {children}
        </AudioPlayerContext.Provider>
    );
};

export const useAudioPlayerContext = () => {
    const context = useContext(AudioPlayerContext);
    if (!context) {
        throw new Error('useAudioPlayerContext must be used within AudioPlayerProvider');
    }
    return context;
};