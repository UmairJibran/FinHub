import { ShareAveragingCalculator } from '@/modules/share-averaging';

export default function ShareAveragingPage(): JSX.Element {
  return (
    <div className="py-10">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h1 className="text-3xl font-bold mb-3">
            Share Averaging Calculator
          </h1>
          <p className="text-muted-foreground">
            Calculate how many shares to buy to reach your target average price.
          </p>
        </div>
        <ShareAveragingCalculator />
      </div>
    </div>
  );
}
