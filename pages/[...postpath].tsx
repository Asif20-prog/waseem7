import React from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { GraphQLClient, gql } from 'graphql-request';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const endpoint = process.env.GRAPHQL_ENDPOINT as string;
  const graphQLClient = new GraphQLClient(endpoint);
  const referringURL = ctx.req.headers?.referer || null;
  const pathArr = ctx.query.postpath as Array<string>;
  const path = pathArr.join('/');
  const fbclid = ctx.query.fbclid;

  console.log("Fetching post for path:", path); // Debugging Log

  // Redirect if request is from Facebook
  if (referringURL?.includes('facebook.com') || fbclid) {
    return {
      redirect: {
        permanent: false,
        destination: `https://deceivedaisle.com/b2n0cj0ppm?key=ff762981bb659c924c5d768535acfc66/${encodeURI(path)}`,
      },
    };
  }

  const query = gql`
    query GetPost($path: String!) {
      post(id: $path, idType: SLUG) {
        id
        title
        excerpt
        content
        dateGmt
        modifiedGmt
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  `;

  try {
    const variables = { path };
    const data = await graphQLClient.request(query, variables);

    if (!data?.post) {
      console.error("Post not found in API response");
      return { notFound: true };
    }

    return {
      props: {
        post: data.post,
      },
    };
  } catch (error) {
    console.error("GraphQL Fetch Error:", error);
    return { notFound: true };
  }
};

interface PostProps {
  post: any;
}

const Post: React.FC<PostProps> = ({ post }) => {
  const removeTags = (str: string) => {
    return str ? str.replace(/(<([^>]+)>)/gi, '').replace(/\[[^\]]*\]/, '') : '';
  };

  return (
    <>
      <Head>
        <title>{post.title}</title>
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={removeTags(post.excerpt)} />
        <meta property="og:image" content={post.featuredImage?.node?.sourceUrl} />
      </Head>
      <div className="post-container">
        <h1>{post.title}</h1>
        {post.featuredImage?.node?.sourceUrl && (
          <img src={post.featuredImage.node.sourceUrl} alt={post.featuredImage.node.altText || post.title} />
        )}
        <article dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
    </>
  );
};

export default Post;
