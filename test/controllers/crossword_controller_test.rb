require 'test_helper'

class CrosswordControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get crossword_index_url
    assert_response :success
  end

end
