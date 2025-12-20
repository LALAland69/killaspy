-- Enable realtime for alerts table to allow real-time notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;