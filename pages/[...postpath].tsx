import React from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { GraphQLClient, gql } from 'graphql-request';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const endpoint = process.env.GRAPHQL_ENDPOINT as string;
    const graphQLClient = new GraphQLClient(endpoint);

    const pathArr = ctx.query.postpath as string[]; // Ensuring it's an array
    const path = pathArr ? pathArr.join('/') : '';

    console.log("Fetching post for path:", path);

    const query = gql`
        query GetPost($path: String!) {
            post(id: $path, idType: URI) {
                id
                title
                content
            }
        }
    `;

    // FIXED: Removing extra slash from path
    const variables = { path: path.replace(/^\/|\/$/g, '') };

    try {
        const data = await graphQLClient.request(query, variables);
        
        // Debugging response
        console.log("GraphQL Response:", JSON.stringify(data, null, 2));

        if (!data?.post) {
            console.warn("Post not found for path:", path);
            return { notFound: true };
        }

        return { props: { post: data.post } };
    } catch (error) {
        console.error("GraphQL Error:", error);
        return { props: { post: null, error: "Post not found or API error" } };
    }
};

const PostPage = ({ post, error }: { post: any; error?: string }) => {
    if (error) {
        return <h1>{error}</h1>;
    }

    return (
        <div>
            <Head>
                <title>{post.title}</title>
            </Head>
            <h1>{post.title}</h1>
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
    );
};

export default PostPage;
