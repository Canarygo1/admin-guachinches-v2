import React from 'react';
import {useQuery} from "@tanstack/react-query";
import {getRestaurantById, Restaurant} from "../../../Data/obj/restaurant";
import {useRouter} from "next/router";

function Test({}) {

  const { data: restaurant, isLoading: isRestaurantLoading, isError: isRestaurantError, error: errorRestaurant } = useQuery<Restaurant, Error>({
    queryFn: () => getRestaurantById('fe75a3ad-cd1a-403b-88b1-41915855b2d1' as string),
    queryKey: ['restaurantDetails'],
    refetchOnWindowFocus: false,
  });

  return (
    <div></div>
  );
}

export default Test;
