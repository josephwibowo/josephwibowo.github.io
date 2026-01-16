"use client";

import Script from "next/script";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function MeetupDashboard() {
    return (
        <div className="min-h-screen bg-white text-black font-sans p-4 relative">
            {/* CSS Assets */}
            <link rel="stylesheet" href="/legacy/css/leaflet.css" />
            <link rel="stylesheet" href="/legacy/css/dc.min.css" />
            <link rel="stylesheet" href="/legacy/css/charts.css" />
            <link rel="stylesheet" href="https://cdn.datatables.net/1.10.18/css/dataTables.bootstrap4.min.css" />
            {/* Manually overriding some dark mode global styles to ensure dashboard looks right on white bg */}
            <style jsx global>{`
          body {
            background-color: white !important;
            color: black !important;
          }
           /* Legacy specific fixes */
           .dc-chart g.row text { fill: black; }
        `}</style>

            <div className="container mx-auto max-w-[1400px]">
                <div className="mb-4">
                    <Link href="/projects/meetup-analytics" className="inline-flex items-center text-blue-600 hover:underline">
                        &larr; Back to Project
                    </Link>
                </div>

                <h2 className="text-2xl font-bold mb-6">Meetup Analytics Dashboard</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Row 1 */}
                    <div>
                        <h5 className="font-bold mb-2">Events over Time (filter with bottom chart)</h5>
                        <div id="time-chart" className="w-full"></div>
                        <div id="time-range-chart" className="w-full"></div>
                    </div>
                    <div>
                        <h5 className="font-bold mb-2">Heatmap of Events</h5>
                        <div id="map" style={{ height: "490px" }} className="w-full border border-gray-300 rounded"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Row 2 */}
                    <div>
                        <h5 className="font-bold mb-2">Top 10 Groups with Most Events</h5>
                        <div id="group-bar-chart" className="w-full"></div>
                    </div>
                    <div>
                        <h5 className="font-bold mb-2">Top 10 Events with Most RSVPs</h5>
                        <div id="event-bar-chart" className="w-full"></div>
                    </div>
                    <div>
                        <h5 className="font-bold mb-2">Top 10 Venues with Most Events</h5>
                        <div id="venue-bar-chart" className="w-full"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {/* Row 3 */}
                    <div>
                        <h5 className="font-bold mb-2">Event Name Wordcloud</h5>
                        <div id="wordcloud" className="w-full"></div>
                        {/* SVG Image manually added here if needed, legacy had it */}
                    </div>
                    <div>
                        <h5 className="font-bold mb-2">Groups Table</h5>
                        <div className="overflow-x-auto">
                            <table id="groups-data-table" className="table-auto w-full border-collapse border border-gray-300"></table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scripts - Load Order is Crucial */}
            <Script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" strategy="beforeInteractive" />
            <Script src="https://d3js.org/d3.v4.min.js" strategy="beforeInteractive" />
            <Script src="/legacy/js/crossfilter.min.js" strategy="afterInteractive" />
            <Script src="/legacy/js/dc.min.js" strategy="afterInteractive" />
            <Script src="/legacy/js/datatables.min.js" strategy="afterInteractive" />
            <Script src="/legacy/js/dc.datatables.js" strategy="afterInteractive" />
            <Script src="/legacy/js/leaflet.js" strategy="afterInteractive" />
            <Script src="/legacy/js/leaflet-heat.js" strategy="afterInteractive" />
            <Script src="/legacy/js/underscore-min.js" strategy="afterInteractive" />
            <Script src="/legacy/js/d3-cloud.js" strategy="afterInteractive" />
            <Script src="https://cdnjs.cloudflare.com/ajax/libs/d3-tip/0.9.1/d3-tip.min.js" strategy="afterInteractive" />

            {/* Main logic script - Lazy load to ensure all above are ready */}
            <Script src="/legacy/js/graphs.js" strategy="lazyOnload" />
        </div>
    );
}
