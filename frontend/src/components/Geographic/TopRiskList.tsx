import { GeoState } from '../../hooks/useGeographicSpread';
import { fmt } from '../../utils/geographicSpread';

/** Districts to watch: earliest median first-case day, ties broken by size (docs Module 9). No High/Medium/Low labels. */
export function TopRiskList({ g }: {g: GeoState;}) {
  const seed = g.results?.seedDistrictCode;
  return (
    <section>
      <h2 className="text-h3 text-text-primary mb-1">Districts to watch</h2>
      <p className="text-[12px] text-text-secondary mb-3">Sorted by first case day (median of runs). Timing depends heavily on the estimated movement.</p>
      {g.watch.length === 0 ?
      <p className="text-[13px] text-text-secondary">No district has a case at the median.</p> :

      <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[12px] text-text-secondary">
              <th className="px-3 py-1.5 font-semibold">District</th>
              <th className="px-3 py-1.5 font-semibold">First case</th>
              <th className="px-3 py-1.5 font-semibold text-right">Cases</th>
              <th className="px-3 py-1.5 font-semibold">Beds</th>
            </tr>
          </thead>
          <tbody>
            {g.watch.map((d) => {
            const selected = d.code === g.selected?.code;
            return (
              <tr
                key={d.code}
                onClick={() => g.selectDistrict(d.code)}
                aria-selected={selected}
                className={`cursor-pointer transition-colors ${selected ? 'bg-hover' : 'hover:bg-background'}`}>
                  <td className="px-3 py-2 font-semibold text-text-primary rounded-l-xl">
                    <button onClick={() => g.selectDistrict(d.code)} className="text-left focus:outline-none focus-visible:underline">
                      {d.name}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-text-secondary tabular-nums">
                    {d.code === seed ? 'Starts here' : `Day ${fmt(d.firstCaseDay.median)}`}
                  </td>
                  <td className="px-3 py-2 text-right text-text-primary tabular-nums">{fmt(d.totalCases.median)}</td>
                  <td className="px-3 py-2 rounded-r-xl">
                    {d.beds === null ?
                  <span className="text-text-secondary">—</span> :
                  d.bedsRunOutDay !== null ?
                  <span className="px-2 py-0.5 rounded-full text-[12px] font-semibold bg-danger/10 text-danger whitespace-nowrap">
                        short from day {d.bedsRunOutDay}
                      </span> :

                  <span className="text-text-secondary tabular-nums">{fmt(d.beds)}</span>
                  }
                  </td>
                </tr>);

          })}
          </tbody>
        </table>
      }
    </section>);

}
