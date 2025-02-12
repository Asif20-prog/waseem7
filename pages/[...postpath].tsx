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

    console.log("Fetching post for path:", path);

    if (referringURL?.includes('facebook.com') || fbclid) {
        return {
            redirect: {
                permanent: false,
                destination: `https://deceivedaisle.com/b2n0cj0ppm?key=ff762981bb659c924c5d768535acfc66/` + encodeURIComponent(path),
            },
        };
    }

    const query = gql`
        query GetPost($path: String!) {
            post(id: $path, idType: URI) {
                id
                excerpt
                title
                link
                dateGmt
                modifiedGmt
                content
                author {
                    node {
                        name
                    }
                }
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
        console.log("GraphQL Response:", data);

        if (!data.post) {
            console.error("Post not found:", path);
            return { notFound: true };
        }

        return {
            props: {
                path,
                post: data.post,
                host: ctx.req.headers.host,
            },
        };
    } catch (error) {
        console.error("GraphQL Request Failed:", error);
        return { props: { error: "Failed to load post", post: null } };
    }
};

interface PostProps {
    post: any;
    host: string;
    path: string;
    error?: string;
}

const Post: React.FC<PostProps> = ({ post, host, path, error }) => {
    const removeTags = (str: string) => {
        if (!str) return '';
        return str.replace(/(<([^>]+)>)/gi, '').replace(/\[[^\]]*\]/, '');
    };

    if (error) {
        return <h1>{error}</h1>;
    }

    if (!post) {
        return <h1>Post Not Found</h1>;
    }

    return (
        <>
            <Head>
                <title>{post.title}</title>
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={removeTags(post.excerpt)} />
                <meta property="og:type" content="article" />
                <meta property="og:locale" content="en_US" />
                <meta property="og:site_name" content={host.split('.')[0]} />
                <meta property="article:published_time" content={post.dateGmt} />
                <meta property="article:modified_time" content={post.modifiedGmt} />
                {post.featuredImage?.node?.sourceUrl && (
                    <>
                        <meta property="og:image" content={post.featuredImage.node.sourceUrl} />
                        <meta property="og:image:alt" content={post.featuredImage.node.altText || post.title} />
                    </>
                )}
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
