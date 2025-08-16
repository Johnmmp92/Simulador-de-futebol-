
class AudioManager {
    private musicElement: HTMLAudioElement;
    private ambianceElement: HTMLAudioElement;
    private sfxElements: Record<string, HTMLAudioElement>;
    private sfxVolume: number = 1;
    private musicVolume: number = 1;
    private ambianceVolume: number = 1;

    constructor() {
        this.musicElement = new Audio();
        this.musicElement.loop = true;
        this.ambianceElement = new Audio();
        this.ambianceElement.loop = true;
        this.sfxElements = {};
    }

    public loadMusic(dataUrl: string | null) {
        if (dataUrl && this.musicElement.src !== dataUrl) {
            this.musicElement.src = dataUrl;
        } else if (!dataUrl) {
             this.musicElement.removeAttribute('src');
        }
    }

    public playMusic() {
        if (this.musicElement.src && this.musicElement.paused) {
            this.musicElement.play().catch(e => console.error("Erro ao tocar música:", e));
        }
    }

    public pauseMusic() {
        if (!this.musicElement.paused) {
            this.musicElement.pause();
        }
    }

    public setMusicVolume(volume: number) {
        this.musicVolume = volume;
        this.musicElement.volume = this.musicVolume;
    }

    public loadAmbiance(dataUrl: string | null) {
        if (dataUrl && this.ambianceElement.src !== dataUrl) {
            this.ambianceElement.src = dataUrl;
        } else if (!dataUrl) {
            this.ambianceElement.removeAttribute('src');
        }
    }

    public playAmbiance() {
        if (this.ambianceElement.src && this.ambianceElement.paused) {
            this.ambianceElement.play().catch(e => console.error("Erro ao tocar ambiente:", e));
        }
    }

    public pauseAmbiance() {
        if (!this.ambianceElement.paused) {
            this.ambianceElement.pause();
        }
    }

    public setAmbianceVolume(volume: number) {
        this.ambianceVolume = volume;
        this.ambianceElement.volume = this.ambianceVolume;
    }

    public loadSfx(sfxMap: Record<string, string | null>) {
        this.sfxElements = {};
        for (const key in sfxMap) {
            const dataUrl = sfxMap[key];
            if (dataUrl) {
                this.sfxElements[key] = new Audio(dataUrl);
            }
        }
    }
    
    public setSfxVolume(volume: number) {
        this.sfxVolume = volume;
    }

    public playSfx(type: string) {
        const sfx = this.sfxElements[type];
        if (sfx) {
            // Clone o nó para permitir a reprodução de várias instâncias do mesmo som sobrepostas
            const sfxToPlay = sfx.cloneNode() as HTMLAudioElement;
            sfxToPlay.volume = this.sfxVolume;
            sfxToPlay.play().catch(e => console.error(`Erro ao tocar SFX '${type}':`, e));
        }
    }
}

export const audioManager = new AudioManager();
