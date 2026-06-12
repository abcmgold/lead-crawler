export default function BackgroundOrbs() {
  return (
    <>
      <div className="fixed top-[-20%] left-[20%] w-[800px] h-[800px] bg-primary/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-pink-500/10 blur-[130px] rounded-full pointer-events-none z-0" />
      <div className="fixed top-[30%] right-[-10%] w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
    </>
  );
}
