import React from 'react';
import {Platform, ScrollView, StyleSheet, Text, View, Linking} from 'react-native';
import {MapView} from 'expo';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';

export default class HomeScreen extends React.Component {
    static navigationOptions = {
        header: null,
    };
    state = {
        location: '',
        mapLatitude: 51.5080,
        mapLongitude: -0.1273,
        keyIter: 0,
        displayList: false,
        markers: []
    };

    render() {
        return (
            <View style={styles.container}>
                <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
                    <View style={styles.getStartedContainer}>
                        <Text style={styles.getStartedText}>Booking.Bikes</Text>
                    </View>
                    <GooglePlacesAutocomplete
                        placeholder='Search'
                        minLength={2} // minimum length of text to search
                        autoFocus={false}
                        returnKeyType={'search'} // Can be left out for default return key https://facebook.github.io/react-native/docs/textinput.html#returnkeytype
                        fetchDetails={true}
                        renderDescription={row => row.description} // custom description render
                        onPress={(data, details = null) => {
                            this.selectLocation(details);
                        }}
                        listViewDisplayed={this.state.displayList}
                        textInputProps={{
                            onFocus: () => this.setState({displayList: true}),
                        }}
                        getDefaultValue={() => ''}
                        query={{
                            // available options: https://developers.google.com/places/web-service/autocomplete
                            key: 'AIzaSyALw5MAHbVFHpAKGfqEoRL8Bwgl0Q5Hmrk',
                            language: 'en', // language of the results
                        }}
                        styles={{
                            textInputContainer: {
                                backgroundColor: '#003680',
                                width: '100%'
                            },
                            description: {
                                fontWeight: 'bold'
                            },
                            predefinedPlacesDescription: {
                                color: '#1faadb'
                            }
                        }}
                        currentLocation={true} // Will add a 'Current location' button at the top of the predefined places list
                        currentLocationLabel="Current location"
                        nearbyPlacesAPI='GooglePlacesSearch' // Which API to use: GoogleReverseGeocoding or GooglePlacesSearch
                        GooglePlacesSearchQuery={{
                            // available options for GooglePlacesSearch API : https://developers.google.com/places/web-service/search
                            rankby: 'distance',
                            types: 'food'
                        }}
                        filterReverseGeocodingByTypes={['locality', 'administrative_area_level_3']} // filter the reverse geocoding results by types - ['locality', 'administrative_area_level_3'] if you want to display only cities
                        debounce={200} // debounce the requests in ms. Set to 0 to remove debounce. By default 0ms.
                    />
                    <MapView
                        style={{alignSelf: 'stretch', height: 600}}
                        initialRegion={{
                            latitude: this.state.mapLatitude,
                            longitude: this.state.mapLongitude,
                            latitudeDelta: 0.04,
                            longitudeDelta: 0.04,
                        }}
                        region={{
                            latitude: this.state.mapLatitude,
                            longitude: this.state.mapLongitude,
                            latitudeDelta: 0.04,
                            longitudeDelta: 0.04,
                        }}
                    >
                        {this.state.markers.map(marker => {
                            return (
                                <MapView.Marker
                                    key={marker.key}
                                    coordinate={marker.latlng}
                                    pinColor={marker.color}
                                    description={marker.description}
                                    title={marker.title}
                                    image={marker.image}
                                />
                            )
                        })}
                    </MapView>
                </ScrollView>
            </View>
        );
    }

    fetchDataMobike = (lat, lng) => {
        fetch('https://mwx.mobike.com/mobike-api/rent/nearbyBikesInfo.do?latitude=' + lat + '&longitude=' + lng)
            .then(response => {
                if (response.ok === true) {
                    return response.json();
                }
            })
            .then(data => {
                if (data.object.length > 0) {
                    let results = data.object;
                    this.setState({markers: [...this.state.markers, ...this.mapBikes(results)]});
                }
            })
            .catch(err => {
                console.log('Error fetching bikes ', err);
            });
    };
    mapBikes = (cars) => {
        return cars.map(bike => ({
            key: this.nextId(),
            latlng: {
                latitude: bike.distY,
                longitude: bike.distX
            },
            color: 'orange',
            title: 'Mobike',
            description: '£0.69 per 20 minutes',
            image: require('../assets/images/blue-icon.png')
        }))
    }
    fetchDataSantander = (lat, lng) => {
        fetch('https://api.tfl.gov.uk/bikepoint')
            .then(response => {
                if (response.ok === true) {
                    return response.json();
                }
            })
            .then(data => {
                if (data.length > 0) {
                    this.setState({markers: [...this.state.markers, ...this.mapSantanderBikes(data, lat, lng)]});
                }
            })
            .catch(err => {
                console.log('Error fetching bikes ', err);
            });
    };
    mapSantanderBikes = (stations, lat, lng) => {
        return stations.slice(75, 125).map(station => {
            if (this.isClose(station, lat, lng)) {
                return {
                    key: this.nextId(),
                    latlng: {
                        latitude: station.lat,
                        longitude: station.lon
                    },
                    color: 'red',
                    title: 'Santander Bike',
                    description: '£2 per 24 hours',
                    image: require('../assets/images/red-icon.png')
                }
            }
        }).filter(station => station != null);
    };
    isClose = (station, lat, lng) => {
        return Math.sqrt(Math.pow(station.lat - lat, 2) + Math.pow(station.lon - lng, 2)) <= 0.02;
    };
    nextId = () => {
        this.setState({keyIter: this.state.keyIter + 1});
        return this.state.keyIter;
    };
    selectLocation = (details) => {
        this.setState({mapLatitude: details.geometry.location.lat});
        this.setState({mapLongitude: details.geometry.location.lng});
        //this.padCoordinatesMobikes(details.geometry.location.lat, details.geometry.location.lng);
        this.fetchDataSantander(details.geometry.location.lat, details.geometry.location.lng);
        this.setState({displayList: false});
        Linking.openURL('whatsapp://app');
    };
    padCoordinatesMobikes = (lat, lng) => {
        for (var i = -0.01; i < 0.015; i += 0.005) {
            for (var j = -0.01; j < 0.015; j += 0.005) {
                this.fetchDataMobike(lat + i, lng + j);
            }
        }
    };
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    input: {
        margin: 20,
        marginBottom: 0,
        height: 34,
        paddingHorizontal: 10,
        borderRadius: 4,
        borderColor: '#ccc',
        borderWidth: 1,
        fontSize: 16,
        width: 200,
    },
    contentContainer: {
        paddingTop: 30,
    },
    welcomeContainer: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    welcomeImage: {
        width: 500,
        height: 300,
        resizeMode: 'contain',
    },
    getStartedContainer: {
        alignItems: 'center',
        backgroundColor: '#003680',
        width: '100%',
    },
    getStartedText: {
        alignItems: 'center',
        color: 'white',
        fontWeight: 'bold',
    },
    homeScreenFilename: {
        marginVertical: 7,
    },
    tabBarInfoContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        ...Platform.select({
            ios: {
                shadowColor: 'black',
                shadowOffset: {height: -3},
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
            android: {
                elevation: 20,
            },
        }),
        alignItems: 'center',
        backgroundColor: '#fbfbfb',
        paddingVertical: 20,
    },
    tabBarInfoText: {
        fontSize: 17,
        color: 'rgba(96,100,109, 1)',
        textAlign: 'center',
    },
    navigationFilename: {
        marginTop: 5,
    },
    helpContainer: {
        marginTop: 15,
        alignItems: 'center',
    },
    helpLink: {
        paddingVertical: 15,
    },
    helpLinkText: {
        fontSize: 14,
        color: '#2e78b7',
    },
});
