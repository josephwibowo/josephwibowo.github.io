import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Meetup Analytics dashboard | Joseph Wibowo",
    description:
        "An interactive dashboard of Bay Area Meetup.com data: groups, events and topics, from an Airflow ETL pipeline, charted with D3.js, dc.js and Leaflet.",
    alternates: { canonical: "/projects/meetup-analytics/dashboard" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return children;
}
