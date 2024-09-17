import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Container, InputGroup, FormControl, Button, Row, Card } from 'react-bootstrap'
import { useState, useEffect } from 'react'

const CLIENT_ID = "02bff9e550704f70a2a5fc6bc8d56fc6"
const CLIENT_SECRET = "7475444037e8413ca4e5f52e3179e633"

function App() {
  const [searchInput, setSearchInput] = useState("")
  const [accessToken, setAccessToken] = useState("")
  const [albums, setAlbums] = useState([])

  useEffect(() => {
    // API Access Token
    var authParameters = {
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

  // Search
  async function search() {
    if (!accessToken) {
      console.log("Access token not available yet.");
      return;
    }

    if (!searchInput) {
      console.log("Search input is empty.");
      return;
    }

    console.log("Search for " + searchInput) // Taylor Swift

    // Get request using search to get the Artist ID
    var searchParameters = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
    }

    var artistID = await fetch('https://api.spotify.com/v1/search?q=' + searchInput + '&type=artist', searchParameters)
     .then(response => response.json())
     .then(data => {
       if (data.artists.items.length > 0) {
         return data.artists.items[0].id;
       } else {
         console.log("No artist found");
         return null;
       }
     })
     .catch(error => console.log(error));

    console.log("Artist ID: " + artistID);

    // Ensure artistID is valid before making the album request
    if (artistID) {
      // Get request with artist ID to grab all the albums from that artist 
      var returnedAlbums = await fetch(`https://api.spotify.com/v1/artists/${artistID}/albums?include_groups=album&market=US&limit=50`, searchParameters)
      .then(response => response.json())
      .then(data => {
        console.log(data); 
        setAlbums(data.items)
      })
      .catch(error => console.log(error));
    } else {
      console.log("No valid artist ID, cannot fetch albums.");
    }
  }
  
  console.log(albums)
  return (
      <div className="App">
        <Container>
          <InputGroup className="mb-3" size='lg'>
            <FormControl
              placeholder="Search For Artist"
              type="input"
              onKeyPress={event => {
                if (event.key === "Enter") {
                  search();
                }
              }}
              onChange={event => setSearchInput(event.target.value)}
            />
            <Button onClick={search}>
              Search
            </Button>
          </InputGroup>
        </Container>
        <Container>
          <Row className="mx-2 row row-cols-4">
            {albums.map( (album, i) => {
              console.log(album)
              return (
                <Card key={i}>
                  <Card.Img variant="top" src={album.images[0].url} />
                  <Card.Body>
                    <Card.Title>{album.name}</Card.Title>
                    <Card.Text>
                      {album.release_date}
                    </Card.Text>
                  </Card.Body>
                </Card>
              )
            })}
          </Row>
        </Container>
      </div>
  )
}

export default App;
