import { SIPSWPCalculator } from "@/modules/sip-swp";

export default function SIPSWPPage(): JSX.Element {
    return (
        <div className="py-10">
            <div className="container">
                <div className="max-w-2xl mx-auto text-center mb-10">
                    <h1 className="text-3xl font-bold mb-3">
                        SIP to SWP Calculator
                    </h1>
                    <p className="text-muted-foreground">
                        Plan your investment journey from Systematic Investment Plan (SIP)
                        to Systematic Withdrawal Plan (SWP) with our advanced calculator.
                    </p>
                </div>
                <SIPSWPCalculator />
            </div>
        </div>
    );
} 