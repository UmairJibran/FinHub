"use client"

import { ResponsiveLine } from "@nivo/line";

import { formatCurrency } from "@/lib/currency-config";

import { CalculationResults } from "../lib/types";

interface InvestmentChartProps {
    data: CalculationResults;
    swpStartYear: number;
    currency: string;
}

export function InvestmentChart({ data, swpStartYear, currency }: InvestmentChartProps): JSX.Element {
    // Split data into SIP and SWP phases
    const sipData = data.filter(item => item.year < swpStartYear).map((item) => ({
        x: `${item.year}-${item.month}`,
        y: parseFloat(item.total.replace(/[^0-9.-]+/g, "")),
        contribution: item.contribution
    }));

    const swpData = data.filter(item => item.year >= swpStartYear).map((item) => ({
        x: `${item.year}-${item.month}`,
        y: parseFloat(item.total.replace(/[^0-9.-]+/g, "")),
        contribution: item.contribution
    }));

    return (
        <ResponsiveLine
            data={[
                {
                    id: "sip",
                    data: sipData,
                    color: "rgb(34, 197, 94)" // green-500
                },
                {
                    id: "swp",
                    data: swpData,
                    color: "rgb(239, 68, 68)" // red-500
                }
            ]}
            margin={{ 
                top: 20,
                right: 40,
                bottom: 20,
                left: 70
            }}
            xScale={{
                type: "point",
            }}
            yScale={{
                type: "linear",
                min: 0,
                max: "auto",
            }}
            axisTop={null}
            axisRight={null}
            axisBottom={null}
            axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                format: (value) =>
                    `${formatCurrency(value, currency)}`,
            }}
            enablePoints={false}
            enableGridX={false}
            lineWidth={2}
            pointSize={4}
            pointColor={{ theme: "background" }}
            pointBorderWidth={2}
            pointBorderColor={{ from: "serieColor" }}
            enableArea={true}
            areaBaselineValue={0}
            areaOpacity={0.1}
            useMesh={true}
            legends={[]}
            theme={{
                axis: {
                    ticks: {
                        text: {
                            fontSize: 12,
                            fill: "#666"
                        }
                    }
                },
                grid: {
                    line: {
                        stroke: "#ddd",
                        strokeDasharray: "4 4"
                    }
                },
                crosshair: {
                    line: {
                        stroke: "#666",
                        strokeWidth: 1,
                        strokeOpacity: 0.5,
                    }
                }
            }}
            tooltip={({ point }) => {
                const data = (point.data as unknown) as { x: string; y: number; contribution: string };
                const isSWP = point.seriesId === "swp";
                const [year, month] = data.x.split("-");
                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                return (
                    <div className="bg-white p-2 shadow-lg rounded-lg border">
                        <p className="text-xs text-gray-500 font-medium mb-2">
                            {months[Number(month) - 1]} {year}
                        </p>
                        <div className="space-y-2">
                            <div>
                                <p className="text-xs text-gray-500">
                                    {isSWP ? "Monthly Withdrawal" : "Monthly Contribution"}
                                </p>
                                <p className={`text-sm font-medium ${isSWP ? "text-red-500" : "text-green-500"}`}>
                                    {formatCurrency(data.contribution, currency)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Portfolio Value</p>
                                <p className="text-sm font-medium text-blue-500">
                                    {formatCurrency(Number(data.y), currency)}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            }}
        />
    );
} 