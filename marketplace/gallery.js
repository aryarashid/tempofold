const panels={cover:'Listing hero with actual planner and overtime timer.',planning:'Actual block editor with durations, minimums, protection and notes.',recovery:'Actual synthetic seven-minute recovery showing two exact cuts.',timer:'Actual overtime timer and a detail of target and projected finish.',print:'Actual printable facilitator run-sheet detail.',protected:'Actual ten-minute protected closing in the synthetic workshop.',square:'Square product promotion with actual recovery preview.',landscape:'Landscape product promotion with actual recovery preview.',portrait:'Portrait product promotion with actual recovery preview.'};
const requested=new URLSearchParams(location.search).get('slide')||'cover';
const key=Object.hasOwn(panels,requested)?requested:'cover';
const path=`./source/${key}.svg`;
document.getElementById('artwork').src=path;
document.getElementById('artwork').alt=panels[key]+' Actual screens with synthetic examples.';
document.getElementById('download-artwork').href=path;
