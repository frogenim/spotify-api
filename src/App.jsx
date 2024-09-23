import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Container, InputGroup, FormControl, Button, Row, Card, Modal, ListGroup, Spinner, Pagination, ProgressBar } from 'react-bootstrap'
import { useState, useEffect, useRef } from 'react'

const CLIENT_ID = "02bff9e550704f70a2a5fc6bc8d56fc6"
const CLIENT_SECRET = "7475444037e8413ca4e5f52e3179e633"
const LYRICS_API_URL = "https://api.lyrics.ovh/v1"
const TOP_TRACKS_PLAYLIST_ID = "37i9dQZF1DXcBWIGoYBM5M"

function App() {
  const [searchInput, setSearchInput] = useState("")
  const [accessToken, setAccessToken] = useState("")
  const [albums, setAlbums] = useState([])
  const [tracks, setTracks] = useState([])
  const [showTracksModal, setShowTracksModal] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState("")
  const [lyrics, setLyrics] = useState("")
  const [loadingLyrics, setLoadingLyrics] = useState(false)
  const [showLyricsModal, setShowLyricsModal] = useState(false)
  const [selectedTrack, setSelectedTrack] = useState("")
  const [loadingAlbums, setLoadingAlbums] = useState(false)
  const [loadingTracks, setLoadingTracks] = useState(false)
  const [selectedAlbumCover, setSelectedAlbumCover] = useState("")
  const [topTracks, setTopTracks] = useState([])
  const [isLoadingTopTracks, setIsLoadingTopTracks] = useState(true)
  const [playingTrack, setPlayingTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const albumsPerPage = 12
  const audioRef = useRef(null)
  const [showPlayerModal, setShowPlayerModal] = useState(false)


  // Fetch token from Spotify
  useEffect(() => {
    const authParameters = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
    }
    fetch('https://accounts.spotify.com/api/token', authParameters)
      .then(result => result.json())
      .then(data => setAccessToken(data.access_token))
  }, [])

  // Handle artist and album search
  async function search() {
    if (!searchInput || !accessToken) return

    setLoadingAlbums(true)

    const searchParameters = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    }

    const artistData = await fetch(`https://api.spotify.com/v1/search?q=${searchInput}&type=artist`, searchParameters)
      .then(res => res.json())
      .catch(err => console.error(err))

    const artistID = artistData?.artists?.items?.[0]?.id
    if (!artistID) {
      console.log("No artist found")
      setLoadingAlbums(false)
      return
    }

    fetch(`https://api.spotify.com/v1/artists/${artistID}/albums?include_groups=album&market=US&limit=50`, searchParameters)
      .then(res => res.json())
      .then(data => setAlbums(data.items))
      .catch(err => console.error(err))

    setLoadingAlbums(false)
  }

  // Fetch top 20 tracks
  useEffect(() => {
    if (!accessToken) return

    const fetchTopTracks = async () => {
      setIsLoadingTopTracks(true)

      const topTracksParameters = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }

      await fetch(`https://api.spotify.com/v1/playlists/${TOP_TRACKS_PLAYLIST_ID}/tracks?market=ID&limit=20`, topTracksParameters)
        .then(response => response.json())
        .then(data => setTopTracks(data.items))
        .catch(error => console.error(error))
        .finally(() => setIsLoadingTopTracks(false))
    }

    fetchTopTracks()
  }, [accessToken])

  // Fetch tracks of a specific album
  function fetchTracks(albumId, albumName, albumCover) {
    setLoadingTracks(true)
    setSelectedAlbum(albumName)
    setSelectedAlbumCover(albumCover)

    const tracksParameters = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    }

    fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks`, tracksParameters)
      .then(res => res.json())
      .then(data => {
        setTracks(data.items)
        setShowTracksModal(true)
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingTracks(false))
  }

  // Handle track preview and audio management
  async function handleTrackPreview(track) {
    // Jika preview_url tidak ada, langsung tampilkan lirik
    if (!track?.preview_url) {
      await fetchLyrics(track.artists[0].name, track.name)
      setShowLyricsModal(true)
      return
    }

    // Jika ada preview, jalankan audio player
    if (audioRef.current) {
      audioRef.current.pause()
    }

    const audio = new Audio(track.preview_url)
    audioRef.current = audio
    audio.play()

    setPlayingTrack(track)
    setIsPlaying(true)

    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime))
    audio.addEventListener('ended', () => {
      setIsPlaying(false)
      setCurrentTime(0)
    })

    // Tampilkan modal player dengan progress bar
    setShowPlayerModal(true)
  }

  async function fetchLyrics(artist, trackName) {
    setLoadingLyrics(true)
    try {
      const response = await fetch(`${LYRICS_API_URL}/${artist}/${trackName}`)
      const data = await response.json()
      setLyrics(data.lyrics || "Lirik tidak tersedia")
    } catch (error) {
      console.error(error)
      setLyrics("Gagal mengambil lirik.")
    } finally {
      setLoadingLyrics(false)
    }
  }

  // Handle pagination
  const indexOfLastAlbum = currentPage * albumsPerPage
  const indexOfFirstAlbum = indexOfLastAlbum - albumsPerPage
  const currentAlbums = albums.slice(indexOfFirstAlbum, indexOfLastAlbum)
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  return (
    <div className="App">
      <Container>
        <h1 className="text-center my-4">Melodify</h1>

        <InputGroup className="mb-3" size="lg">
          <FormControl
            placeholder="Search For Artist"
            onKeyPress={event => event.key === "Enter" && search()}
            onChange={e => setSearchInput(e.target.value)}
          />
          <Button onClick={search}>Search</Button>
        </InputGroup>
      </Container>

      <Container className="my-4">
        {!albums.length && (
          <>
            <h2 className="text-center">Top 20 Lagu</h2>
            {isLoadingTopTracks ? (
              <div className="d-flex justify-content-center my-5">
                <Spinner animation="border" />
              </div>
            ) : (
              <Row className="mx-2 row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4">
                {topTracks.map((track, i) => (
                  <Card key={i} onClick={() => handleTrackPreview(track.track)} style={{ cursor: 'pointer' }}>
                    <Card.Img variant="top" src={track.track.album.images?.[0]?.url || "https://via.placeholder.com/150"} />
                    <Card.Body>
                      <Card.Title>{track.track.name}</Card.Title>
                      <Card.Text>{track.track.artists[0].name}</Card.Text>
                    </Card.Body>
                  </Card>
                ))}
              </Row>
            )}
          </>
        )}

        {loadingAlbums ? (
          <div className="d-flex justify-content-center my-5">
            <Spinner animation="border" />
          </div>
        ) : (
          <Row className="mx-2 row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4">
            {currentAlbums.map((album, i) => (
              <Card key={i} className="mb-4" onClick={() => fetchTracks(album.id, album.name, album.images[0]?.url)} style={{ cursor: 'pointer' }}>
                <Card.Img variant="top" src={album.images[0]?.url || "https://via.placeholder.com/150"} className="img-fluid" />
                <Card.Body>
                  <Card.Title className="text-truncate">{album.name}</Card.Title>
                  <Card.Text>{album.artists[0].name}</Card.Text>
                </Card.Body>
              </Card>
            ))}
          </Row>
        )}

        {/* Pagination */}
        {albums.length > albumsPerPage && (
          <Pagination className="my-3 justify-content-center">
            {Array(Math.ceil(albums.length / albumsPerPage)).fill().map((_, i) => (
              <Pagination.Item key={i + 1} onClick={() => paginate(i + 1)}>
                {i + 1}
              </Pagination.Item>
            ))}
          </Pagination>
        )}

        {/* Tracks Modal */}
        <Modal show={showTracksModal} onHide={() => setShowTracksModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>{selectedAlbum}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {loadingTracks ? (
              <div className="d-flex justify-content-center my-5">
                <Spinner animation="border" />
              </div>
            ) : (
              <ListGroup>
                {tracks.map((track, i) => (
                  <ListGroup.Item key={i} onClick={() => handleTrackPreview(track)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <img
                      src={selectedAlbumCover || "https://via.placeholder.com/50"}
                      alt={track.name}
                      style={{ width: '50px', height: '50px', marginRight: '15px' }}
                    />
                    {track.name}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Modal.Body>
        </Modal>


        {/* Player Modal */}
        <Modal show={showPlayerModal} onHide={() => setShowPlayerModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Now Playing: {playingTrack?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ProgressBar now={(currentTime / duration) * 100} label={`${Math.round(currentTime)}s`} />
            <div className="d-flex justify-content-center my-3">
              <Button
                onClick={() => {
                  if (isPlaying) {
                    audioRef.current.pause();
                    setIsPlaying(false);
                  } else {
                    audioRef.current.play();
                    setIsPlaying(true);
                  }
                }}
              >
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
            </div>
          </Modal.Body>
        </Modal>


        {/* Lyrics Modal */}
        <Modal show={showLyricsModal} onHide={() => setShowLyricsModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Lirik Lagu</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            {loadingLyrics ? (
              <div className="d-flex justify-content-center my-5">
                <Spinner animation="border" />
              </div>
            ) : (
              <pre style={{ whiteSpace: 'pre-wrap' }}>{lyrics}</pre>
            )}
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  )
}

export default App
