import React from 'react';
import Link from 'next/link';

const ServerErrorPage = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
            <h1 className="text-4xl font-bold mb-4">Server Configuration Error</h1>
            <p className="text-lg mb-8">There was an error with the server configuration. Please try again later.</p>
            <Link href="/">
                <a className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-700 transition">Go to Home</a>
            </Link>
        </div>
    );
};

export default ServerErrorPage;