import React from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { GraphQLClient, gql } from 'graphql-request';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const endpoint = process.env.GRAPHQL_ENDPOINT as string;
    const graphQLClient = new GraphQLClient(endpoint);

    const pathArr = ctx.query.postpath as Array<string>;
    const path = pathArr.join('/');

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

    const variables = { path: `/${path}/` };

    try {
        const data = await graphQLClient.request(query, variables);
        return { props: { post: data.post } };
    } catch (error) {
        console.error("GraphQL Error:", error);
        return { props: { post: null, error: "Post not found" } };
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
