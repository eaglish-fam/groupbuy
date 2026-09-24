const directions={
 sort:['先看 M 號雙面開口','二代與 Lite 都有 M 號雙面款，可按上衣／褲子或乾淨／已穿分類。再比較袋身與重量，最後量箱內空間。'],
 light:['先看 Lite 的標示重量','Lite S 為 110g、M 為 190g、L 為 180g。先挑用得到的尺寸，不必把整套都帶上；袋子與衣物都要計入行李總重。'],
 shape:['先看二代的袋身結構','二代有發泡中間層與支撐結構，適合先納入偏好立體袋身的選擇。再依是否需要雙面開口，挑 M 或單開 S／L。'],
 small:['先試現有的收納袋','衣物少、箱內也好分類時，不必急著多買。把小物與衣物分開，確定需要壓縮或雙面分裝，再增加合適的一袋。']
};
const input=document.getElementById('packing-need'),result=document.getElementById('choice-result');
input.addEventListener('change',()=>{const [title,body]=directions[input.value]||directions.sort;result.querySelector('h3').textContent=title;result.querySelector('p').textContent=body;});
