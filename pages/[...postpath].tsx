import React from "react";
import Head from "next/head";
import { GetServerSideProps } from "next";
import { GraphQLClient, gql } from "graphql-request";

// GraphQL API Client Setup
const endpoint = process.env.GRAPHQL_ENDPOINT || "https://dev-grapql.pantheonsite.io/graphql";

const graphQLClient = new GraphQLClient(endpoint, {
  headers: {
    "Content-Type": "application/json",
  },
});

// GraphQL Query to Fetch Post
const query = gql`
  query GetPost($path: String!) {
    post(id: $path, idType: URI) {
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

// Fetch Post Function
export async function fetchPost(path: string) {
  try {
    const variables = { path: `/${path}/` };
    const data = await graphQLClient.request(query, variables);

    if (!data?.post) {
      throw new Error("Post not found");
    }

    return data.post;
  } catch (error) {
    console.error("GraphQL Request Failed:", error);
    return null;
  }
}

// Server-Side Props Fetching
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const pathArr = ctx.query.postpath as Array<string>;
  const path = pathArr.join("/");

  console.log("Fetching post:", path);

  const post = await fetchPost(path);

  if (!post) {
    return { notFound: true };
  }

  return {
    props: {
      post,
    },
  };
};

interface PostProps {
  post: any;
}

const Post: React.FC<PostProps> = ({ post }) => {
  // Remove HTML Tags from Excerpt
  const removeTags = (str: string) => {
    if (!str) return "";
    return str.replace(/(<([^>]+)>)/gi, "").replace(/\[[^\]]*\]/g, "");
  };

  return (
    <>
      <Head>
        <title>{post.title}</title>
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={removeTags(post.excerpt)} />
        <meta property="og:image" content={post.featuredImage?.node?.sourceUrl} />
        <meta property="og:image:alt" content={post.featuredImage?.node?.altText || post.title} />
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
