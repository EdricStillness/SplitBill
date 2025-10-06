import LottieView from 'lottie-react-native';
import React from 'react';

type Props = {
  autoPlay?: boolean;
  loop?: boolean;
  source: any;
  style?: any;
};

export default function Lottie(props: Props) {
  return <LottieView {...props} />;
}
