import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, MessageSquare, Bug, Lightbulb, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  initialType?: 'bug' | 'suggestion' | 'question';
}

const translations: Record<string, any> = {
  en: {
    title: "Feedback & Support",
    subtitle: "Help us improve Sea Otter Post Office. We value your thoughts!",
    typeLabel: "Feedback Type",
    bug: "Bug Report",
    suggestion: "Suggestion",
    question: "Question",
    messageLabel: "Your Message",
    placeholder: "Tell us what's on your mind...",
    submit: "Send Feedback",
    success: "Thank you! Your feedback has been received.",
    close: "Close"
  },
  zh: {
    title: "意见与反馈",
    subtitle: "帮助我们改进海獭邮局。您的每一条建议对我们都很重要！",
    typeLabel: "反馈类型",
    bug: "问题反馈",
    suggestion: "功能建议",
    question: "咨询疑问",
    messageLabel: "您的留言",
    placeholder: "请描述您遇到的问题或建议...",
    submit: "提交反馈",
    success: "提交成功！感谢您的反馈。",
    close: "关闭"
  }
};

export default function FeedbackModal({ isOpen, onClose, language, initialType = 'suggestion' }: Props) {
  const t = translations[language] || translations.en;
  const [type, setType] = useState(initialType);
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // In a real app, send to backend
    console.log('Feedback submitted:', { type, message });
    setIsSubmitted(true);
    
    setTimeout(() => {
      onClose();
      setIsSubmitted(false);
      setMessage('');
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8">
              {isSubmitted ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 mb-2">{t.success}</h3>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-stone-900">{t.title}</h2>
                    </div>
                  </div>
                  <p className="text-stone-500 mb-8 text-sm">{t.subtitle}</p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-3">{t.typeLabel}</label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setType('bug')}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                            type === 'bug' ? 'border-red-500 bg-red-50 text-red-700' : 'border-stone-100 hover:border-stone-200 text-stone-500'
                          }`}
                        >
                          <Bug className="w-5 h-5" />
                          <span className="text-xs font-medium">{t.bug}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setType('suggestion')}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                            type === 'suggestion' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-stone-100 hover:border-stone-200 text-stone-500'
                          }`}
                        >
                          <Lightbulb className="w-5 h-5" />
                          <span className="text-xs font-medium">{t.suggestion}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setType('question')}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                            type === 'question' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-stone-100 hover:border-stone-200 text-stone-500'
                          }`}
                        >
                          <MessageSquare className="w-5 h-5" />
                          <span className="text-xs font-medium">{t.question}</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">{t.messageLabel}</label>
                      <textarea
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={t.placeholder}
                        className="w-full h-32 p-4 rounded-2xl border-2 border-stone-100 focus:border-indigo-500 focus:ring-0 transition-all resize-none text-stone-900"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-stone-900/10"
                    >
                      <Send className="w-5 h-5" />
                      {t.submit}
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
