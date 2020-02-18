import React from "react";
import { Alert } from "react-native";
import Button from "../../atoms/Button";
import { useMutation } from "react-apollo";
import gql from "graphql-tag";
import { useAuth } from "../../../customHooks";

const REQUESTED_ERROR = "You have requested please wait...";
const ACCEPTED_ERROR = "You are already helping ...";
const REJECTED_ERROR = "You have rejected, try help others ...";

const HELP_UPDATE_SCHEMA = gql`
  mutation UpdateHelp($id:String!,$key:String!,$value:Any){
    updateHelp(id:$id,key:$key,value:$value, type:"array", operation:"push"){
      _id
    }
  }
`;

const HelpButton = (props) => {
  const { data } = props;
  const { usersAccepted, usersRequested, creator, _id, usersRejected } = data;
  const { user: currentUser } = useAuth();
  const { uid, displayName } = currentUser;
  const [updateHelp, { loading }] = useMutation(HELP_UPDATE_SCHEMA);

  handleHelp = () => {
    if (usersAccepted.map((user) => user.uid).indexOf(uid) > -1) {
      Alert.alert(ACCEPTED_ERROR);
    } else if (usersRequested.map((user) => user.uid).indexOf(uid) > -1) {
      Alert.alert(REQUESTED_ERROR);
    } else if (usersRejected.map((user) => user.uid).indexOf(uid) > -1) {
      Alert.alert(REJECTED_ERROR);
    } else {
      updateHelp({ variables: { id: _id, key: "usersRequested", value: { uid, name: displayName, xp: 0, stars: 0 } } });
    }
  }

  return <Button onPress={handleHelp} loading={loading}>Help</Button>
}

export default HelpButton;