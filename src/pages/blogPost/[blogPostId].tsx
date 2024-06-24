import React from 'react';
import { useRouter } from 'next/router';
import BlogPostEdit from "../../components/blogPostEdit";



const RestaurantDetails: React.FC = () => {
  const router = useRouter();
  const { blogPostId } = router.query;

  if (!blogPostId || typeof blogPostId !== 'string') {
    return null;
  }

  return <BlogPostEdit blogPostId={blogPostId} />;
};

export default RestaurantDetails;
