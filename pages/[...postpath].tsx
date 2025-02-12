import React from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { GraphQLClient, gql } from 'graphql-request';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const endpoint = process.env.GRAPHQL_ENDPOINT as string;
    const graphQLClient = new GraphQLClient(endpoint);
    const pathArr = ctx.query.postpath as Array<string>;
    const path = pathArr.join('/');

    console.log("🔍 Fetching post for path:", path);

    const query = gql`
        query GetPost($path: String!) {
            post(id: $path, idType: URI) {
                id
                title
                excerpt
                content
                featuredImage {
                    node {
                        sourceUrl
                        altText
                    }
                }
            }
        }
    `;

    const variables = { path: `/${path}/` };

    try {
        const data = await graphQLClient.request(query, variables);
        console.log("✅ GraphQL Response:", JSON.stringify(data, null, 2));

        if (!data.post) {
            console.error("❌ Post Not Found:", path);
            return { notFound: true };
        }

        return {
            props: { path, post: data.post },
        };
    } catch (error: any) {
        console.error("❌ GraphQL Request Failed:", error.message);
        return { props: { error: `Failed to load post: ${error.message}`, post: null } };
    }
};

interface PostProps {
    post: any;
    path: string;
    error?: string;
}

const Post: React.FC<PostProps> = ({ post, path, error }) => {
    if (error) {
        return (
            <div>
                <h1>Error Loading Post</h1>
                <p>{error}</p>
            </div>
        );
    }

    if (!post) {
        return <h1>Post Not Found</h1>;
    }

    return (
        <>
            <Head>
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={post.excerpt.replace(/(<([^>]+)>)/gi, '')} />
                <meta property="og:type" content="article" />
                <meta property="og:image" content={post.featuredImage?.node?.sourceUrl} />
                <title>{post.title}</title>
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
