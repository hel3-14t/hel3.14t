// @flow
import React from "react";
import { FlatList, Platform, UIManager, Text } from 'react-native';
import { getDistanceFromLatLonInKm, sortByDistance } from '../../utils';
import gql from 'graphql-tag';
import { useQuery } from 'react-apollo';
import { HelpRequestCard } from "../oraganisms";
import { useLocation } from "../../customHooks";

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const HELPS = gql`
  query Helps($offset:Int!) {
    helps(offset:$offset) {
      _id,
      latitude,
      longitude,
      timeStamp,
      description,
      status,
      creatorName
    }
  }
`;

const HelpRequestFeed = () => {
  const { longitude, latitude, locationProviderAvailable } = useLocation();
  const { loading, data, error, fetchMore } = useQuery(HELPS, {
    variables: {
      offset: 0
    },
    fetchPolicy: "cache-and-network",
  });

  const getHelps = () => {
    fetchMore({
      variables: {
        offset: getRequestedHelpRequests(data.helps).length
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          helps: [...prev.helps, ...fetchMoreResult.helps]
        });
      }
    })
  }

  if (error) return <Text>{error.networkError}</Text>

  const gethelpRequestsSortedByDistance = (feedItems) => {
    if(!locationProviderAvailable) return feedItems;
    const requestedHelpRequests = getRequestedHelpRequests(feedItems);
    const helpRequestsWithDistance = getHelpRequestsWithDistance(requestedHelpRequests);
    const helpRequestsSortedByDistance = sortByDistance(helpRequestsWithDistance);
    return helpRequestsSortedByDistance;
  }

  const getRequestedHelpRequests = (helpRequests) => {
    return helpRequests.filter(({ status }) => status === "REQUESTED");
  }

  const getHelpRequestsWithDistance = (helpRequests) => {
    return helpRequests.map((helpRequest) => {
      const lattitudeOfUser = latitude;
      const longitudeOfUser = longitude;
      const lattitudeOfHelpRequest = helpRequest.latitude;
      const longitudeOfHelpRequest = helpRequest.longitude;
      const dist = getDistanceFromLatLonInKm(lattitudeOfUser, longitudeOfUser, lattitudeOfHelpRequest, longitudeOfHelpRequest );
      const newObj = {
        ...helpRequest,
        userLatitude: lattitudeOfUser,
        userLongitude: longitudeOfUser,
        distance: dist
      };  
      return newObj;
    });
  }

  removeHelpRequest = (idOfHelpRequest) => {
    data.helps = data.helps.filter(({_id}) => idOfHelpRequest !== _id)
  }

  const getHelpRequest = ({ item }) => {
    return <HelpRequestCard helpRequestDetails={item} removeMe={removeHelpRequest} />
  }

  return (
    <FlatList
      data={gethelpRequestsSortedByDistance(data ? data.helps : [])}
      renderItem={getHelpRequest}
      keyExtractor={(_, index) => index.toString()}
      onRefresh={getHelps}
      refreshing={loading}
    />
  );
}

export default HelpRequestFeed;
