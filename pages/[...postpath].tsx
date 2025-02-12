import React from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { GraphQLClient, gql } from 'graphql-request';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
	const endpoint = process.env.GRAPHQL_ENDPOINT as string;

	if (!endpoint) {
		console.error("GRAPHQL_ENDPOINT is not set in the environment variables.");
		return { notFound: true };
	}

	const graphQLClient = new GraphQLClient(endpoint);
	const pathArr = ctx.query.postpath as Array<string>;
	const path = pathArr?.join('/') || '';

	if (!path) {
		console.error("Path is undefined or empty.");
		return { notFound: true };
	}

	try {
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

		const variables = { path: `/${path}/` };
		const data = await graphQLClient.request(query, variables);

		if (!data?.post) {
			console.error(`No post found for path: ${path}`);
			return { notFound: true };
		}

		return {
			props: { post: data.post, path },
		};
	} catch (error) {
		console.error("GraphQL request failed:", error);
		return { notFound: true };
	}
};

interface PostProps {
	post: any;
	path: string;
}

const Post: React.FC<PostProps> = ({ post, path }) => {
	if (!post) {
		return <h1>404 - Post Not Found</h1>;
	}

	return (
		<>
			<Head>
				<title>{post.title}</title>
				<meta name="description" content={post.excerpt} />
				<meta property="og:title" content={post.title} />
				<meta property="og:description" content={post.excerpt} />
				<meta property="og:image" content={post.featuredImage?.node?.sourceUrl || ''} />
			</Head>
			<div>
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
