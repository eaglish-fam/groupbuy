/* Scope this trip to the verified Caesar segment; use the shared click-to-load player. */
const caesarVideo=document.querySelector('#caesar-videos');
if(caesarVideo){
  ProductContent.mountVideos(caesarVideo,[{title:'鷹式一家｜墾丁凱撒看房與用餐，從16:19開始',url:'https://www.youtube.com/watch?v=0oNzr8gyxyQ&t=979s'}]);
  const poster=caesarVideo.querySelector('.video-poster img');
  if(poster)poster.src='/assets/caesar-kenting/journal/family-1630.webp';
}
