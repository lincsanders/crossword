class CrosswordChannel < ApplicationCable::Channel
  attr_accessor :data

  def subscribed
    stream_from "crossword_#{params[:room]}"

    transmit_current_storage
  end

  def storage_updated data
    Rails.cache.write(params[:room], data['storage'])

    transmit_current_storage
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end

  private 

  def transmit_current_storage
    ActionCable.server.broadcast "crossword_#{params[:room]}", {
      action: 'storage_updated',
      data: {
        storage: Rails.cache.read(params[:room]) || {}
      }
    }
  end
end
