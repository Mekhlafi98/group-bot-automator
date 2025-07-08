-- Create telegram_groups table
CREATE TABLE public.telegram_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id BIGINT NOT NULL UNIQUE,
  chat_title TEXT,
  chat_type TEXT DEFAULT 'group',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create n8n_workflows table  
CREATE TABLE public.n8n_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message_filters table
CREATE TABLE public.message_filters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.telegram_groups(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES public.n8n_workflows(id) ON DELETE CASCADE,
  filter_name TEXT NOT NULL,
  filter_type TEXT NOT NULL CHECK (filter_type IN ('keyword', 'regex', 'sender_role', 'message_type', 'ai_classification')),
  filter_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  ai_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message_logs table
CREATE TABLE public.message_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.telegram_groups(id) ON DELETE CASCADE,
  filter_id UUID REFERENCES public.message_filters(id) ON DELETE SET NULL,
  workflow_id UUID REFERENCES public.n8n_workflows(id) ON DELETE SET NULL,
  message_id BIGINT NOT NULL,
  sender_id BIGINT NOT NULL,
  sender_username TEXT,
  message_text TEXT,
  message_type TEXT,
  matched_filter_type TEXT,
  matched_filter_value TEXT,
  workflow_triggered BOOLEAN DEFAULT false,
  workflow_response TEXT,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.telegram_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (public access for now - adjust based on auth requirements)
CREATE POLICY "Allow all operations on telegram_groups" ON public.telegram_groups FOR ALL USING (true);
CREATE POLICY "Allow all operations on n8n_workflows" ON public.n8n_workflows FOR ALL USING (true);
CREATE POLICY "Allow all operations on message_filters" ON public.message_filters FOR ALL USING (true);
CREATE POLICY "Allow all operations on message_logs" ON public.message_logs FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX idx_telegram_groups_chat_id ON public.telegram_groups(chat_id);
CREATE INDEX idx_message_filters_group_id ON public.message_filters(group_id);
CREATE INDEX idx_message_filters_workflow_id ON public.message_filters(workflow_id);
CREATE INDEX idx_message_filters_active ON public.message_filters(is_active);
CREATE INDEX idx_message_logs_group_id ON public.message_logs(group_id);
CREATE INDEX idx_message_logs_processed_at ON public.message_logs(processed_at);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_telegram_groups_updated_at
  BEFORE UPDATE ON public.telegram_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_n8n_workflows_updated_at
  BEFORE UPDATE ON public.n8n_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_filters_updated_at
  BEFORE UPDATE ON public.message_filters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();