'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './page.module.css'

interface AudioFile {
  file: File
  url: string
  name: string
  duration: number
}

export default function Home() {
  const [playlist, setPlaylist] = useState<AudioFile[]>([])
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showVolume, setShowVolume] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => playNext()

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [currentIndex])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const audioFiles = files.filter(file => file.type.startsWith('audio/'))

    const newFiles: AudioFile[] = await Promise.all(
      audioFiles.map(async (file) => {
        const url = URL.createObjectURL(file)
        const audio = new Audio(url)

        return new Promise<AudioFile>((resolve) => {
          audio.addEventListener('loadedmetadata', () => {
            resolve({
              file,
              url,
              name: file.name.replace(/\.[^/.]+$/, ''),
              duration: audio.duration
            })
          })
        })
      })
    )

    setPlaylist(prev => [...prev, ...newFiles])
  }

  const playSong = (index: number) => {
    setCurrentIndex(index)
    setIsPlaying(true)

    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play()
      }
    }, 100)
  }

  const togglePlayPause = () => {
    if (!audioRef.current || currentIndex === null) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const playNext = () => {
    if (currentIndex === null || playlist.length === 0) return
    const nextIndex = (currentIndex + 1) % playlist.length
    playSong(nextIndex)
  }

  const playPrevious = () => {
    if (currentIndex === null || playlist.length === 0) return
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1
    playSong(prevIndex)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    setCurrentTime(time)
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    if (audioRef.current) {
      audioRef.current.volume = vol
    }
  }

  const removeSong = (index: number) => {
    const newPlaylist = playlist.filter((_, i) => i !== index)
    setPlaylist(newPlaylist)

    if (currentIndex === index) {
      setCurrentIndex(null)
      setIsPlaying(false)
    } else if (currentIndex !== null && currentIndex > index) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
            <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <h1>Music Player</h1>
        </div>
      </header>

      <main className={styles.main}>
        {playlist.length === 0 ? (
          <div className={styles.empty}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
              <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <h2>No songs in playlist</h2>
            <p>Add audio files to get started</p>
          </div>
        ) : (
          <div className={styles.playlist}>
            {playlist.map((song, index) => (
              <div
                key={index}
                className={`${styles.songItem} ${currentIndex === index ? styles.active : ''}`}
                onClick={() => playSong(index)}
              >
                <div className={styles.songNumber}>
                  {currentIndex === index && isPlaying ? (
                    <div className={styles.equalizer}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <div className={styles.songInfo}>
                  <div className={styles.songName}>{song.name}</div>
                  <div className={styles.songDuration}>{formatTime(song.duration)}</div>
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    removeSong(index)
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <div className={styles.player}>
        {currentIndex !== null && playlist[currentIndex] && (
          <>
            <div className={styles.nowPlaying}>
              <div className={styles.trackInfo}>
                <div className={styles.trackName}>{playlist[currentIndex].name}</div>
              </div>
            </div>

            <div className={styles.progressBar}>
              <span className={styles.time}>{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className={styles.slider}
              />
              <span className={styles.time}>{formatTime(duration)}</span>
            </div>
          </>
        )}

        <div className={styles.controls}>
          <button
            className={styles.addBtn}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          <div className={styles.mainControls}>
            <button onClick={playPrevious} disabled={playlist.length === 0}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M19 20L9 12l10-8v16zM5 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <button
              className={styles.playBtn}
              onClick={togglePlayPause}
              disabled={playlist.length === 0}
            >
              {isPlaying ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
                  <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M8 5v14l11-7z" fill="currentColor"/>
                </svg>
              )}
            </button>

            <button onClick={playNext} disabled={playlist.length === 0}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 4l10 8-10 8V4zM19 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className={styles.volumeControl}>
            <button
              onClick={() => setShowVolume(!showVolume)}
              className={styles.volumeBtn}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {showVolume && (
              <div className={styles.volumeSlider}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className={styles.slider}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {currentIndex !== null && playlist[currentIndex] && (
        <audio ref={audioRef} src={playlist[currentIndex].url} />
      )}
    </div>
  )
}
