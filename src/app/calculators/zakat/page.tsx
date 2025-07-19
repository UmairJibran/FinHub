import { ZakatCalculator } from "@/modules/zakat/components/zakat-calculator";

export default function ZakatCalculatorPage(): React.ReactNode {
    return (
        <div className="py-10">
            <div className="container">
                <div className="max-w-2xl mx-auto text-center mb-10">
                    <h1 className="text-3xl font-bold mb-3">
                        Zakat Calculator
                    </h1>
                    <p className="text-muted-foreground">
                        Calculate your annual Zakat obligation with our easy-to-use calculator.
                    </p>
                </div>
                <ZakatCalculator />
            </div>
        </div>
    );
} 