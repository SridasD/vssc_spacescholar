const Footer: React.FC = () => {
    return (
        <footer className="mt-8 text-center space-y-3">
        <div className="transform hover:scale-105 transition-transform duration-300">
          <p className="text-sm font-medium bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent tracking-wider">
            SPACE SCHOLAR © 2026 | An initiative by Library &amp; Information Resource Division ,VSSC

          </p>
          <p className="text-xs mt-2 leading-relaxed flex items-center justify-center gap-2">
                  <span className="font-semibold text-gray-700">&ldquo;A Partnership in Innovation&rdquo;</span>
                  <span className="text-gray-400">·</span>
                  <span>Vikram Sarabhai Space Centre &amp; Digital University Kerala</span>
          </p>
        </div>
        <div className="relative">
          <div className="h-px w-48 mx-auto bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-40"></div>
          <div className="absolute inset-0 blur-sm bg-blue-500/10"></div>
        </div>
      </footer>
    );
  };
  
  export default Footer;