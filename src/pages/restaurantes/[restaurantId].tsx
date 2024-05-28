import React from 'react';
import { useRouter } from 'next/router';
import RestaurantEdit from "../../components/RestaurantEdit";



const RestaurantDetails: React.FC = () => {
  const router = useRouter();
  const { restaurantId } = router.query;

  if (!restaurantId || typeof restaurantId !== 'string') {
    return null;
  }

  return <RestaurantEdit restaurantId={restaurantId} />;
};

export default RestaurantDetails;
